(() => {
  "use strict";

// DOM 
  const tape = document.getElementById("tape");           
  const mainValue = document.getElementById("mainValue"); 
  const memFlag = document.getElementById("memFlag");     
  const keys = document.querySelector(".keys");
// State
  let inputBuffer = "0";       
  let exprTokens = [];        
  let justEvaluated = false;   
  let memory = 0;              
  const isDigit = (ch) => /[0-9]/.test(ch);
  const isOperator = (t) => t === "×" || t === "÷" || t === "−" || t === "+";

  const clamp = (n, decimals = 12) => {
    if (!isFinite(n)) return n;
    return parseFloat(Number(n).toFixed(decimals));
  };

  const setDisplay = (v) => (mainValue.textContent = v);
  const getDisplayNumber = () => {
    const v = parseFloat(mainValue.textContent || "0");
    return isFinite(v) ? v : 0;
  };
  const setTape = (text) => (tape.textContent = text || "");
function stripTrailingZeros(s) {
    if (!s.includes(".")) return s;
    s = s.replace(/\.?0+$/, "");
    return s === "-0" ? "0" : s;
  }
function buildTape(withEquals = false) {
    const parts = [...exprTokens];
    if (inputBuffer !== "") parts.push(inputBuffer);
    return (parts.join(" ") || "") + (withEquals ? " =" : "");
  }

// Memory indicator
function updateMemFlag() {
    if (Number(memory) !== 0) memFlag.classList.add("on");
    else memFlag.classList.remove("on");
  }

//  Reset, AC does't clear memory
function resetAll() {
    inputBuffer = "0";
    exprTokens = [];
    justEvaluated = false;
    setDisplay("0");
    setTape("");
    updateMemFlag();
  }
  resetAll();

// Input 
function pushDigit(d) {
    if (justEvaluated) {
      exprTokens = [];
      inputBuffer = "0";
      justEvaluated = false;
    }
if (inputBuffer === "0" && d !== ".") inputBuffer = d;
else if (d === ".") {
      if (!inputBuffer.includes(".")) inputBuffer += ".";
    } else inputBuffer += d;

    setDisplay(inputBuffer);
    setTape(buildTape());
  }

function toggleSign() {
    if (inputBuffer === "0") return;
    inputBuffer = inputBuffer.startsWith("-")
      ? inputBuffer.slice(1)
      : "-" + inputBuffer;
    setDisplay(inputBuffer);
    setTape(buildTape());
  }
function applyPercent() {
    let current = parseFloat(inputBuffer || "0");
    if (!isFinite(current)) return;

    if (exprTokens.length >= 2 && isOperator(exprTokens.at(-1))) {
      const prev = parseFloat(exprTokens.at(-2));
      current = isFinite(prev) ? prev * (current / 100) : current / 100;
    } else {
      current = current / 100;
    }
inputBuffer = stripTrailingZeros(clamp(current).toString());
    setDisplay(inputBuffer);
    setTape(buildTape());
}
// Operators 
function normalizeOperator(op) {
  if (op === "*" || op === "x" || op === "X") return "×";
  if (op === "/") return "÷";
  if (op === "-") return "−";
  if (op === "+") return "+";
  if (isOperator(op)) return op;
    return null;
  }
function pushOperator(opRaw) {
  const op = normalizeOperator(opRaw);
  if (!op) return;
if (justEvaluated) {
  exprTokens = [mainValue.textContent];
  justEvaluated = false;
}
if (inputBuffer !== "") {
  exprTokens.push(inputBuffer);
  inputBuffer = "";
}
if (exprTokens.length && isOperator(exprTokens.at(-1))) {
  exprTokens[exprTokens.length - 1] = op;
} else {
  exprTokens.push(op);
}
setDisplay(exprTokens.join(" ") || "0");
  setTape(buildTape());
}
function equals() {
  if (inputBuffer !== "") {
    exprTokens.push(inputBuffer);
    inputBuffer = "";
}
  if (exprTokens.length && isOperator(exprTokens.at(-1))) exprTokens.pop();
  if (!exprTokens.length) return;
    const shownExpr = exprTokens.join(" ");
    let result;
    try {
      result = safeEvaluateTokens(exprTokens);
    } catch {
      setDisplay("Error");
      setTape(shownExpr + " =");
      exprTokens = [];
      inputBuffer = "";
      justEvaluated = true;
      return;
    }

  if (!isFinite(result)) {
      setDisplay("Error");
      setTape(shownExpr + " =");
      exprTokens = [];
      inputBuffer = "";
      justEvaluated = true;
      return;
    }

    const out = stripTrailingZeros(clamp(result).toString());
    setDisplay(out);
    setTape(shownExpr + " =");

    exprTokens = [out];
    inputBuffer = "";
    justEvaluated = true;
  }
//  Memory functions 
function memoryClear() {
  memory = 0;
  updateMemFlag();
}
function memoryRecall() {
    inputBuffer = stripTrailingZeros(clamp(memory).toString());
    setDisplay(inputBuffer);
    setTape(buildTape());
    justEvaluated = false;
}
function memoryAdd() {
  memory = clamp(memory + getDisplayNumber());
  updateMemFlag();
}
function memorySubtract() {
  memory = clamp(memory - getDisplayNumber());
  updateMemFlag();
}
function precedence(op) {
  if (op === "×" || op === "÷") return 2;
  if (op === "−" || op === "+") return 1;
  return 0;
}
function applyOp(a, op, b) {
  a = parseFloat(a); b = parseFloat(b);
  switch (op) {
    case "×": return a * b;
    case "÷": return b === 0 ? Infinity : a / b;
    case "−": return a - b;
    case "+": return a + b;
    default: throw new Error("Unknown operator");
}
}
function safeEvaluateTokens(tokens) {
    if (!tokens.length) return 0;
    tokens = tokens.map(t => isOperator(t) ? t : normalizeOperator(t) || t);
// handle unary minus
  const normalized = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "−" && (i === 0 || isOperator(normalized.at(-1)))) {
      const next = tokens[i + 1];
    if (next != null && !isOperator(next)) {
      normalized.push(String(-parseFloat(next)));
        i++;
          continue;
      } else {
        normalized.push("0","−");
        continue;
        }
      }
      normalized.push(t);
    }

// shunting-yard → RPN
  const output = [];
  const ops = [];
  for (const t of normalized) {
    if (t === "" || t == null) continue;
    if (!isOperator(t)) {
      if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(String(t))) throw new Error("Invalid token");
      output.push(t);
      } else {
        while (ops.length && isOperator(ops.at(-1)) && precedence(ops.at(-1)) >= precedence(t)) {
          output.push(ops.pop());
    }
        ops.push(t);
     }
 }
    while (ops.length) output.push(ops.pop());
// evaluate RPN
    const stack = [];
    for (const t of output) {
      if (!isOperator(t)) stack.push(t);
      else {
        if (stack.length < 2) throw new Error("Malformed expression");
        const b = stack.pop();
        const a = stack.pop();
        stack.push(applyOp(a, t, b));
   }
 }
    if (stack.length !== 1) throw new Error("Malformed expression");
    return stack[0];
  }

// Click wiring
  keys.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const label = btn.textContent.trim();
// Memory keys
    if (btn.classList.contains("mem")) {
      if (label === "MC") memoryClear();
      else if (label === "MR") memoryRecall();
      else if (label === "M+") memoryAdd();
      else if (label === "M−") memorySubtract();
      return;
    }
// Utilities
    if (btn.classList.contains("util")) {
      if (/AC/i.test(label)) return resetAll();
      if (label.includes("+/")) return toggleSign();
      if (label.includes("%")) return applyPercent();
   }

// Equals
  if (btn.classList.contains("equals")) return equals();
  if (btn.classList.contains("op")) return pushOperator(label);
// Numbers / dot
  if (btn.classList.contains("num")) {
    return pushDigit(label === "." ? "." : label);
  }
});

// keyboard support 
  window.addEventListener("keydown", (e) => {
    const k = e.key;
// prevent unwanted page actions
  if (["Enter","=","Escape","Backspace"].includes(k) || isDigit(k) || "+-*/xX.%".includes(k) || k.toLowerCase() === "m") {
      e.preventDefault();
  }
// Memory shortcuts: m → MR   |  Shift+m → MC   |  Alt+m → M+   |  Alt+Shift+m → M−
  if (k.toLowerCase() === "m") {
    if (e.shiftKey && e.altKey) return memorySubtract();
    if (e.shiftKey) return memoryClear();
    if (e.altKey) return memoryAdd();
    return memoryRecall();
  }

    if (isDigit(k)) return pushDigit(k);
    if (k === ".") return pushDigit(".");
    if (k === "Enter" || k === "=") return equals();
    if (k === "Escape") return resetAll();

    if (k === "Backspace") {
      if (inputBuffer !== "") {
        inputBuffer = inputBuffer.length > 1 ? inputBuffer.slice(0, -1) : "0";
        setDisplay(inputBuffer);
        setTape(buildTape());
     
      } else if (exprTokens.length) {
        const last = exprTokens.pop();
        if (!isOperator(last)) {
          inputBuffer = String(last);
          inputBuffer = inputBuffer.length > 1 ? inputBuffer.slice(0, -1) : "0";
          setDisplay(inputBuffer);
       
          setTape(buildTape());
        } else {
          setDisplay(exprTokens.join(" ") || "0");
          setTape(buildTape());
        }
      } else {
        setDisplay("0");
        setTape("");
      }
      return;
    }

    if (k === "%") return applyPercent();
    if (k === "_") return toggleSign();

    const op = normalizeOperator(k);
    if (op) return pushOperator(op);
    if (["×","÷","−","+"].includes(k)) return pushOperator(k);
  });
})();