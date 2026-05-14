const calculatorData = {
  calculation: "",
  result: "",
  displayedResults: false
}

const buttons = [...document.querySelectorAll("[data-action]")]
const digitsBtns = buttons.filter(button => /[0-9]/.test(button.getAttribute("data-action")))

digitsBtns.forEach(btn => btn.addEventListener("click", handleDigits))

const calculationDisplay = document.querySelector(".calculation");
const resultDisplay = document.querySelector(".result");

function handleDigits(e){
  const buttonValue = e.target.getAttribute("data-action");

  if(calculatorData.displayedResults){
    calculationDisplay.textContent = "";
    calculatorData.calculation = "";
    calculatorData.displayedResults = false;
  }
  
  // Empêcher d'avoir plusieurs zéros au début
  if(calculatorData.calculation === "0" && buttonValue !== ".") {
    calculatorData.calculation = "";
  }

  calculatorData.calculation += buttonValue;
  resultDisplay.textContent = calculatorData.calculation;
}

const operatorsBtns = buttons.filter(button => /[\/+*-]/.test(button.getAttribute("data-action")))

operatorsBtns.forEach(btn => btn.addEventListener("click", handleOperators))

function handleOperators(e){
  const buttonValue = e.target.getAttribute("data-action");

  if(calculatorData.displayedResults){
    calculationDisplay.textContent = "";
    calculatorData.calculation = calculatorData.result + buttonValue;
    resultDisplay.textContent = calculatorData.calculation;
    calculatorData.displayedResults = false;
    return;
  }
  
  // Permettre de commencer par un nombre négatif
  if(!calculatorData.calculation && buttonValue === "-"){
    calculatorData.calculation += buttonValue;
    resultDisplay.textContent = calculatorData.calculation;
    return;
  }
  
  // Empêcher de commencer par un opérateur autre que -
  if(!calculatorData.calculation) return;
  
  // Empêcher d'avoir un point suivi directement d'un opérateur
  if(calculatorData.calculation.slice(-1) === ".") return;
  
  // Remplacer le dernier opérateur si on en met un nouveau
  if(calculatorData.calculation.slice(-1).match(/[\/+*-]/)){
    calculatorData.calculation = calculatorData.calculation.slice(0, -1) + buttonValue;
    resultDisplay.textContent = calculatorData.calculation;
  }
  else {
    calculatorData.calculation += buttonValue;
    resultDisplay.textContent = calculatorData.calculation;
  }
}

const decimalButton = document.querySelector("[data-action='.']")

decimalButton.addEventListener("click", handleDecimal);

function handleDecimal (){
  // Empêcher de mettre un point si pas de chiffres avant
  if(!calculatorData.calculation) return;
  
  // Si le résultat est affiché, réinitialiser
  if(calculatorData.displayedResults){
    calculatorData.calculation = "";
    calculatorData.displayedResults = false;
    resultDisplay.textContent = "";
    calculationDisplay.textContent = "";
  }

  let lastSetOfNumbers = "";
  
  // Récupérer le dernier nombre
  for(let i = calculatorData.calculation.length - 1; i >= 0; i--) {
    if(/[\/+*-]/.test(calculatorData.calculation[i])){
      break;
    }
    else {
      lastSetOfNumbers += calculatorData.calculation[i];
    }
  }
  
  lastSetOfNumbers = lastSetOfNumbers.split("").reverse().join("");
  
  // Vérifier si le dernier nombre contient déjà un point
  if(!lastSetOfNumbers.includes(".")) {
    calculatorData.calculation += ".";
    resultDisplay.textContent = calculatorData.calculation;
  }
}

const equalBtn = document.querySelector("[data-action='=']")

equalBtn.addEventListener("click", handleEqualBtn);

function handleEqualBtn(){
  // Vérifier si le calcul se termine par un opérateur ou un point
  if(/[\/+*-.]/.test(calculatorData.calculation.slice(-1))){
    calculationDisplay.textContent = "Terminez le calcul par un chiffre.";
    setTimeout(() => {
      calculationDisplay.textContent = "";
    }, 2500)
    return;
  }
  
  if(!calculatorData.displayedResults && calculatorData.calculation){
    try {
      calculatorData.result = customEval(calculatorData.calculation);
      resultDisplay.textContent = calculatorData.result;
      calculationDisplay.textContent = calculatorData.calculation;
      calculatorData.displayedResults = true;
    } catch (error) {
      calculationDisplay.textContent = "Erreur de calcul";
      setTimeout(() => {
        calculationDisplay.textContent = "";
      }, 2500);
    }
  }
}

function customEval(calculation){
  // Fonction d'évaluation sécurisée pour les opérations de base
  // Cette version corrigée gère correctement les opérations
  try {
    // Remplacer l'évaluation personnalisée par une approche plus simple mais sécurisée
    // Pour une calculatrice simple, on peut utiliser Function ou eval avec validation
    // mais on va créer une version plus robuste
    
    // Vérifier si c'est une expression simple
    if(!/[\/+*-]/.test(calculation.slice(1))) return calculation;
    
    // Traiter les multiplications et divisions en premier (priorité des opérateurs)
    let expression = calculation;
    
    // Gérer les multiplications et divisions
    let mulDivPattern = /(\d+(?:\.\d+)?)([*/])(\d+(?:\.\d+)?)/;
    while(mulDivPattern.test(expression)) {
      expression = expression.replace(mulDivPattern, (match, left, operator, right) => {
        const leftNum = parseFloat(left);
        const rightNum = parseFloat(right);
        if(operator === '*') return (leftNum * rightNum).toString();
        if(operator === '/') return (leftNum / rightNum).toString();
        return match;
      });
    }
    
    // Gérer les additions et soustractions
    let addSubPattern = /(\d+(?:\.\d+)?)([+-])(\d+(?:\.\d+)?)/;
    while(addSubPattern.test(expression)) {
      expression = expression.replace(addSubPattern, (match, left, operator, right) => {
        const leftNum = parseFloat(left);
        const rightNum = parseFloat(right);
        if(operator === '+') return (leftNum + rightNum).toString();
        if(operator === '-') return (leftNum - rightNum).toString();
        return match;
      });
    }
    
    // Formater le résultat
    const result = parseFloat(expression);
    if(isNaN(result)) return "0";
    
    // Gérer les décimales
    if(result.toString().includes(".")) {
      const decimalParts = result.toString().split(".");
      if(decimalParts[1].length === 1) {
        return result.toString();
      } else if(decimalParts[1].length > 1) {
        return result.toFixed(2).replace(/\.?0+$/, '');
      }
    }
    
    return result.toString();
    
  } catch (error) {
    return "0";
  }
}

const resetButton = document.querySelector("[data-action='c']")

resetButton.addEventListener("click", reset);

function reset(){
  calculatorData.calculation = "";
  calculatorData.displayedResults = false;
  calculatorData.result = "";
  resultDisplay.textContent = "0";
  calculationDisplay.textContent = "";
}

const clearEntryButton = document.querySelector("[data-action='ce']")

clearEntryButton.addEventListener("click", clearEntry);

function clearEntry(){
  if(!calculatorData.displayedResults){
    if(calculatorData.calculation === "") return;
    if(calculatorData.calculation.length === 1) {
      calculatorData.calculation = "0";
    }
    else {
      calculatorData.calculation = calculatorData.calculation.slice(0, -1);
      if(calculatorData.calculation === "") calculatorData.calculation = "0";
    }
    resultDisplay.textContent = calculatorData.calculation;
  } else {
    // Si un résultat est affiché, CE réinitialise juste le calcul en cours
    reset();
  }
}

// Gestion des touches du clavier
document.addEventListener('keydown', handleKeyboardInput);

function handleKeyboardInput(e) {
  const key = e.key;
  
  // Chiffres
  if(/[0-9]/.test(key)) {
    e.preventDefault();
    const digitButton = document.querySelector(`[data-action='${key}']`);
    if(digitButton) digitButton.click();
  }
  
  // Opérateurs
  if(/[+\-*/]/.test(key)) {
    e.preventDefault();
    const operatorMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/'
    };
    const operatorButton = document.querySelector(`[data-action='${operatorMap[key]}']`);
    if(operatorButton) operatorButton.click();
  }
  
  // Point décimal
  if(key === '.') {
    e.preventDefault();
    decimalButton.click();
  }
  
  // Entrée ou égal
  if(key === 'Enter' || key === '=') {
    e.preventDefault();
    equalBtn.click();
  }
  
  // Effacement
  if(key === 'Escape' || key === 'c' || key === 'C') {
    e.preventDefault();
    resetButton.click();
  }
  
  // Effacement d'un caractère
  if(key === 'Backspace') {
    e.preventDefault();
    clearEntryButton.click();
  }
}