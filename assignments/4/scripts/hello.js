function showMessage(){
    const name = "JavaScript";
    const message = `Hello, ${name}!`; // ✅ Use backticks instead of single quotes
    console.log(message);
    const out= document.getElementById ("output");
    if (out) out.textContent = message;
}