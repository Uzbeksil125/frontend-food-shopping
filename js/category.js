const params = new URLSearchParams(window.location.search);
const cat = params.get("cat");

const title = document.getElementById("catTitle");
const box = document.getElementById("foods");

const categoryObj = categories.find(c => c.id === cat);
title.innerText = categoryObj ? categoryObj.name : "Category";

const list = getAllFoods().filter(f => f.cat === cat);

box.innerHTML = "";
list.forEach(f => {
  box.innerHTML += cardHTML(f);
});

updateCardStates();
// ensure add buttons exist
if(typeof ensureAddButtons==='function') ensureAddButtons();
if(typeof showLoader==='function') showLoader();
if(typeof waitForImagesIn==='function'){
  waitForImagesIn(box,4000).then(()=>{ if(typeof hideLoader==='function') hideLoader(); });
} else { if(typeof hideLoader==='function') hideLoader(); }
