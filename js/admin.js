const select=document.getElementById("cat");

categories.forEach(c=>{
 select.innerHTML+=`<option value="${c.id}">${c.name}</option>`;
});

function addFood(){
 const name=document.getElementById("name").value;
 const img=document.getElementById("img").value;
 const cat=select.value;

 let adminFoods=JSON.parse(localStorage.getItem("adminFoods"))||[];
 adminFoods.push({
  id:Date.now(),
  name,
  cat,
  img
 });

 localStorage.setItem("adminFoods",JSON.stringify(adminFoods));
 alert("Food added ✅");
}
