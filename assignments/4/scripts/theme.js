
document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("theme-select");
  if (!select) return;
  const savedTheme = localStorage.getItem("theme") || "default";
  document.body.setAttribute("data-theme", savedTheme);
  select.value = savedTheme;

  select.addEventListener("change", (e) => {
    const theme = e.target.value;
    
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  

});


});
