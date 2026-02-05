const foodBox=document.getElementById("foods");
const bar=document.getElementById("categories");

bar.innerHTML = `<button onclick="filterFoods('all')">All</button>`;
// Insert 'For You' right after All (before categories)
bar.innerHTML += `<button id="for-you" onclick="filterFoods('for-you')">For You</button>`;
categories.forEach(c=>{
 bar.innerHTML+=`<button id="${c.id}" onclick="filterFoods('${c.id}')">${c.name}</button>`;
});
// add 'For You' category showing most ordered items
// Note: keep only one 'For You' button (placed after All)

function filterFoods(cat){
 const all = getAllFoods();
 if(cat==="all") renderFoods(all);
 else if(cat==='for-you'){
    // compute most ordered items from localStorage orders
    const orders = JSON.parse(localStorage.getItem('orders'))||[];
    const counts = {};
    orders.forEach(o=>{ (o.items||[]).forEach(it=>{ counts[String(it.id)] = (counts[String(it.id)]||0) + (it.qty||0); }); });
    const ids = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
    const foods = ids.map(id=> all.find(x=>String(x.id)===String(id))).filter(Boolean);
    renderFoods(foods);
 } else renderFoods(all.filter(f=>f.cat===cat));
}

renderFoods(getAllFoods());

function renderFoods(list){
 foodBox.innerHTML="";
 // show loader while images load
 if(typeof showLoader==='function') showLoader();
 list.forEach(f=>{
    foodBox.innerHTML += cardHTML(f);
 });
 // update buttons/icons to reflect saved state
 updateCardStates();
 // ensure Add buttons exist
 if(typeof ensureAddButtons==='function') ensureAddButtons();
 // wait for images in the foodBox then hide loader
 if(typeof waitForImagesIn==='function'){
    waitForImagesIn(foodBox, 4000).then(()=>{
        if(typeof hideLoader==='function') hideLoader();
    });
 } else {
    if(typeof hideLoader==='function') hideLoader();
 }
}