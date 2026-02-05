const dark=document.getElementById("dark");

function toggleTheme(){
 dark.disabled=!dark.disabled;
 localStorage.setItem("dark",!dark.disabled);
}

if(localStorage.getItem("dark")==="true"){
 dark.disabled=false;
}
