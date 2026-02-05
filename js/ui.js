// Shared UI helpers: render card HTML, manage favorites, wishlist and cart (localStorage)
(function(){
 window.getAllFoods = function(){
  const adminFoods = JSON.parse(localStorage.getItem('adminFoods'))||[];
  // keep original `foods` as first; admin foods appended
  return (typeof foods !== 'undefined') ? foods.concat(adminFoods) : adminFoods;
 };

  // Realistic price ranges per category with explicit overrides
  function getPriceFor(f){
    const name = String(f.name||'').toLowerCase();
    const cat = String(f.cat||'').toLowerCase();
    // explicit name-based overrides (USD)
    const overrides = {
      'somsa': 0.5,
      'tandir somsa': 1.0,
      'shashlik kuskavoy': 1.5,
      'shashlik': 1.5,
      'kuskavoy': 1.5,
      'kofta': 1.5,
      'plov': 2.0,
      'manti': 0.3,
      'lagman': 1.5,
      'norin': 2.0,
      'chuchvara': 2.0,
      'kazan kebab': 5.0,
      'cola': 1.0
    };
    // check exact or partial name matches first
    for(const key in overrides){
      if(name === key || name.includes(key)) return overrides[key].toFixed(2);
    }
    // ranges in dollars [min,max]
    const ranges = {
      beverage:[1.00,3.00],
      desserts:[2.00,6.00],
      icecream:[2.00,5.00],
      mcdonalds:[2.50,7.00],
      taco:[3.00,8.00],
      panda:[4.00,9.00],
      chinese:[5.00,12.00],
      japanese:[6.00,18.00],
      italian:[6.00,16.00],
      uzbek:[2.00,5.00],
      seafood:[10.00,25.00],
      steak:[12.00,30.00],
      combos:[7.00,18.00],
      royal:[8.00,20.00],
      special:[6.00,20.00],
      default:[4.00,12.00]
    };
    let range = ranges.default;
    Object.keys(ranges).forEach(k=>{ if(cat.includes(k)) range = ranges[k]; });
    // deterministic pseudo-random from id or name
    const seedStr = String(f.id||f.name||'');
    let seed=0; for(let i=0;i<seedStr.length;i++) seed = (seed*31 + seedStr.charCodeAt(i))>>>0;
    const t = (seed % 100) / 100;
    const price = range[0] + (range[1]-range[0]) * t;
    return price.toFixed(2);
  }

window.cardHTML = function(f){
  const fid = String(f.id);
  const price = getPriceFor(f);
  return `
    <div class="card" data-id="${fid}">
      <img src="${f.img}" loading="lazy" alt="${(f.name||'').replace(/"/g,'')}">
      <h3>${f.name}</h3>
      <div class="price">$${price}</div>
      <div class="card-controls">
        <div class="left-controls">
          <button type="button" id="fav-${fid}" class="fav-btn" onclick="toggleFav('${fid}')">🤍</button>
        </div>
        <div class="order">
          <input id="qty-${fid}" class="qty-input" type="number" min="1" value="1">
        </div>
        <div class="order-add">
          <button type="button" id="cart-${fid}" class="cart-btn" onclick="addToCart('${fid}')">Add to cart</button>
        </div>
      </div>
    </div>
  `;
 };

 // Loading overlay and image-wait helpers
 function ensureLoader(){
  let el = document.getElementById('loader-overlay');
  if(!el){
    el = document.createElement('div');
    el.id = 'loader-overlay';
    el.innerHTML = `<div class="loader-box"><div class="spinner"></div><div class="loader-text">Loading…</div></div>`;
    document.body.appendChild(el);
  }
  return el;
 }

 window.showLoader = function(){
  const el = ensureLoader();
  el.style.display = 'flex';
 };

 window.hideLoader = function(){
  const el = document.getElementById('loader-overlay');
  if(el) el.style.display = 'none';
 };

 // Wait for images inside a container (or document) to load or timeout
 window.waitForImagesIn = function(container, timeout=4000){
  return new Promise(resolve=>{
    if(!container) return resolve();
    const imgs = Array.from(container.querySelectorAll('img'));
    if(imgs.length===0) return resolve();
    let finished = 0;
    const done = ()=>{
      finished++;
      if(finished>=imgs.length) resolve();
    };
    imgs.forEach(img=>{
      if(img.complete) return done();
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    });
    // safety timeout
    setTimeout(resolve, timeout);
  });
 };

 function readArr(key){ return JSON.parse(localStorage.getItem(key))||[]; }
 function writeArr(key,arr){ localStorage.setItem(key,JSON.stringify(arr)); }

 window.toggleFav = function(id){
  const arr = readArr('favs');
  const idx = arr.indexOf(id);
  if(idx===-1) arr.push(id); else arr.splice(idx,1);
  writeArr('favs',arr);
  updateFavIcon(id);
 };

 window.updateFavIcon = function(id){
  const btn = document.getElementById('fav-'+id);
  if(!btn) return;
  const favs = readArr('favs');
  btn.textContent = favs.indexOf(id)===-1 ? '🤍' : '❤️';
 };

// wishlist removed: replaced by cart panel in header

 window.changeQty = function(id,delta){
  const input = document.getElementById('qty-'+String(id));
  if(!input) return;
  let v = parseInt(input.value)||1;
  v += delta;
  if(v<1) v=1;
  input.value = v;
 };

 window.addToCart = function(id){
  const idStr = String(id);
  const qtyInput = document.getElementById('qty-'+idStr);
  const qty = Math.max(1, parseInt(qtyInput?qtyInput.value:1)||1);
  const all = getAllFoods();
  const f = all.find(x=>String(x.id)===idStr) || {};
  const price = parseFloat(getPriceFor(f));
  const cart = readArr('cart');
  const idx = cart.findIndex(x=>String(x.id)===idStr);
  if(idx===-1) cart.push({id:idStr,qty,price}); else cart[idx].qty += qty;
  writeArr('cart',cart);
  const btn = document.getElementById('cart-'+idStr);
  if(btn){
    const prev = btn.textContent;
    btn.textContent = 'Added ✓';
    setTimeout(()=> btn.textContent = 'Add',1200);
  }
  updateCartBadge();
  // stay on the current page after adding (no navigation)
  return true;
 };

 window.updateCartBadge = function(){
  const cart = readArr('cart');
  const total = cart.reduce((s,i)=>s+(i.qty||0),0);
  // show a small badge in header if present
  let el = document.getElementById('cart-badge');
  if(!el){
    const header = document.querySelector('.top');
    if(header){
      el = document.createElement('span');
      el.id = 'cart-badge';
      el.className = 'cart-badge';
      header.appendChild(el);
    }
  }
  if(el) el.textContent = total? `🛒 ${total}` : '';
 };

window.updateCardStates = function(){
  const all = getAllFoods();
  all.forEach(f=>{
    updateFavIcon(String(f.id));
  });
  updateCartBadge();
 };

 // expose helpers for other scripts
window.changeQty = window.changeQty;
window.addToCart = window.addToCart;
window.toggleFav = window.toggleFav;

// Fallback: ensure each card has a visible Add button (in case templates/CSS hide it)
window.ensureAddButtons = function(){
  const cards = document.querySelectorAll('.card');
  cards.forEach(card=>{
    if(card.querySelector('.cart-btn')) return; // already has one
    const id = card.getAttribute('data-id') || card.dataset.id;
    const orderAdd = document.createElement('div');
    orderAdd.className = 'order-add';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cart-btn';
    btn.id = 'cart-fallback-'+id;
    btn.textContent = 'Add to cart';
    btn.addEventListener('click', ()=>{
      try{ addToCart(id); }catch(e){ console.error(e); }
    });
    orderAdd.appendChild(btn);
    // place at end of card-controls or top of card
    const controls = card.querySelector('.card-controls') || card;
    controls.appendChild(orderAdd);
  });
};

// ----- Cart panel and order history -----
function ensureCartRoot(){
  let root = document.getElementById('cart-root');
  if(!root){
    const header = document.querySelector('.top');
    root = document.createElement('div');
    root.id = 'cart-root';
    if(header) header.appendChild(root);
  }
  return root;
}

window.initCartUI = function(){
  const root = ensureCartRoot();
  root.innerHTML = `
    <div class="balance-area">Balance: $<span id="bal-amt">0.00</span> <button class="add-bal" onclick="addBalancePrompt()">+</button></div>
    <a href="cart.html" id="cart-toggle" class="cart-toggle">🛒 <span id="cart-count"></span></a>
  `;
  updateCartBadge();
  updateBalanceDisplay();
}

window.toggleCartPanel = function(){
  const panel = document.getElementById('cart-panel');
  if(!panel) return;
  panel.style.display = panel.style.display==='flex'?'none':'flex';
  if(panel.style.display==='flex') renderCartPanel();
}

window.getCart = function(){ return readArr('cart'); };
window.setCart = function(c){ writeArr('cart',c); updateCartBadge(); };

window.renderCartPanel = function(){
  const content = document.getElementById('cart-content');
  if(!content) return;
  const cart = getCart();
  if(cart.length===0){
    content.innerHTML = `<div class="empty">Cart is empty</div>`;
    return;
  }
  let html = '<div class="cart-items">';
  const all = getAllFoods();
  let totalCost = 0;
  cart.forEach(item=>{
    const f = all.find(x=>String(x.id)===String(item.id))||{};
    const price = parseFloat(item.price || getPriceFor(f));
    const subtotal = (price * (item.qty||1));
    totalCost += subtotal;
    html += `<div class="cart-item" data-id="${item.id}">
      <img src="${f.img||''}" alt="${(f.name||'').replace(/"/g,'')}">
      <div class="ci-info"><div class="ci-name">${f.name||'Item'}</div>
      <div class="ci-qty">Qty: <input type="number" min="1" value="${item.qty||1}" onchange="cartItemQtyChange('${item.id}',this.value)"></div>
      <div class="ci-price">$${price.toFixed(2)} · <strong>$${subtotal.toFixed(2)}</strong></div>
      </div>
      <button type="button" class="ci-remove" onclick="removeFromCart('${item.id}')">Remove</button>
    </div>`;
  });
  html += `</div><div class="cart-summary">Total: <strong>$${totalCost.toFixed(2)}</strong></div>`;
  html += `<div class="cart-actions"><button onclick="checkout()" class="checkout">Buy</button></div>`;
  content.innerHTML = html;
}

window.cartItemQtyChange = function(id, val){
  const cart = getCart();
  const idx = cart.findIndex(x=>String(x.id)===String(id));
  if(idx===-1) return;
  const q = Math.max(1, parseInt(val)||1);
  cart[idx].qty = q;
  setCart(cart);
  renderCartPanel();
}

window.removeFromCart = function(id){
  const cart = getCart().filter(x=>String(x.id)!==String(id));
  setCart(cart);
  renderCartPanel();
}

window.checkout = function(){
  const cart = getCart();
  if(cart.length===0){ alert('Cart is empty'); return false; }
  // compute total cost
  let total = 0;
  cart.forEach(item=>{ total += (parseFloat(item.price||0) * (item.qty||1)); });
  total = Math.round(total*100)/100;
  const bal = getBalance();
  if(bal < total){
    if(confirm(`Insufficient funds. Order total is $${total.toFixed(2)} but your balance is $${bal.toFixed(2)}. Add funds?`)){
      addBalancePrompt();
    }
    return false;
  }
  // deduct balance and save order with total
  const orders = readArr('orders');
  const order = { id:Date.now(), created:new Date().toISOString(), items:cart, total };
  orders.unshift(order);
  writeArr('orders',orders);
  setCart([]);
  setBalance(bal - total);
  try{ renderCartPanel(); }catch(e){}
  alert('Order placed ✅');
  return true;
}

window.renderOrdersPanel = function(){
  const content = document.getElementById('cart-content');
  if(!content) return;
  const orders = readArr('orders');
  if(orders.length===0){ content.innerHTML = '<div class="empty">No orders yet</div>'; return; }
  const all = getAllFoods();
  let html = '<div class="orders-list">';
  orders.forEach(o=>{
    html += `<div class="order-block"><div class="order-meta">Order #${o.id} — ${new Date(o.created).toLocaleString()} ${o.total? ' — Total: $'+parseFloat(o.total).toFixed(2):''}</div>`;
    o.items.forEach(it=>{ const f = all.find(x=>String(x.id)===String(it.id))||{}; html += `<div class="order-item">${f.name||'Item'} × ${it.qty||1} ${it.price? ' @ $'+parseFloat(it.price).toFixed(2):''}</div>`; });
    html += '</div>';
  });
  html += '</div>';
  content.innerHTML = html;
}

window.updateCartBadge = function(){
  const cart = readArr('cart');
  const total = cart.reduce((s,i)=>s+(i.qty||0),0);
  // update top small badge text
  const count = document.getElementById('cart-count');
  if(count) count.textContent = total? total : '';
  // also keep legacy badge
  let el = document.getElementById('cart-badge');
  if(el) el.textContent = total? `🛒 ${total}` : '';
};

// Balance helpers
function getBalance(){ return parseFloat(localStorage.getItem('balance'))||0; }
function setBalance(v){ localStorage.setItem('balance', (Math.round(v*100)/100).toFixed(2)); updateBalanceDisplay(); }
function updateBalanceDisplay(){ const el = document.getElementById('bal-amt'); if(el) el.textContent = (getBalance()).toFixed(2); }
window.addBalancePrompt = function(){
  const val = prompt('Enter amount to add (USD)', '10');
  if(!val) return;
  const n = Math.max(0, parseFloat(val)||0);
  if(n<=0) return;
  const newB = getBalance()+n;
  setBalance(newB);
  alert(`Balance updated: $${newB.toFixed(2)}`);
};

// ensure cart UI exists on load
document.addEventListener('DOMContentLoaded', ()=>{
  initCartUI();
});

})();
