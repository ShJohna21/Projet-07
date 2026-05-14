const sentence = document.querySelector(".sentence-to-write");
const textareaToTest = document.querySelector(".textarea-to-test");
let spansFromAPISentence;

// API plus fiable avec HTTPS
const APIEndpoint = "https://api.quotable.io/random";

// Phrase par défaut au cas où l'API ne répond pas
const defaultSentence = "Le développement web est amusant et enrichissant";

async function getNewSentence() {
  try {
    // Afficher un message de chargement
    sentence.textContent = "Chargement d'une nouvelle phrase...";
    
    const response = await fetch(APIEndpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.content;
    
    if (!content) {
      throw new Error("La phrase est vide");
    }
    
    displaySentence(content);
    
  } catch (error) {
    console.error("Erreur API:", error);
    // Utiliser une phrase par défaut en cas d'erreur
    displaySentence(defaultSentence);
    sentence.style.color = "orange";
    setTimeout(() => {
      sentence.style.color = "";
    }, 2000);
  }
}

function displaySentence(content) {
  sentence.textContent = "";
  
  content.split("").forEach(character => {
    const spanCharacter = document.createElement("span");
    spanCharacter.textContent = character;
    sentence.appendChild(spanCharacter);
  });
  
  spansFromAPISentence = sentence.querySelectorAll("span");
  textareaToTest.value = "";
  locked = false;
  textareaToTest.disabled = false;
  
  // Réinitialiser les couleurs
  if (spansFromAPISentence) {
    spansFromAPISentence.forEach(span => span.className = "");
  }
}

// Charger une première phrase au démarrage
getNewSentence();

const timeDisplayed = document.querySelector(".time");
const scoreDisplayed = document.querySelector(".score");

window.addEventListener("keydown", handleStart);

let time;
let score;
let timerID;
let locked = false;
let gameActive = false;

function handleStart(e) {
  if (e.key === "Escape") {
    resetGame();
  }
}

function resetGame() {
  // Arrêter le timer existant
  if (timerID) {
    clearInterval(timerID);
    timerID = undefined;
  }

  // Réinitialiser les variables
  time = 60;
  score = 0;
  locked = false;
  gameActive = true;

  // Activer l'interface
  timeDisplayed.classList.add("active");
  textareaToTest.classList.add("active");
  textareaToTest.disabled = false;

  // Mettre à jour l'affichage
  timeDisplayed.textContent = `Temps : ${time}s`;
  scoreDisplayed.textContent = `Score : ${score}`;
  textareaToTest.value = "";

  // Réinitialiser les couleurs des spans si la phrase existe
  if (spansFromAPISentence && spansFromAPISentence.length > 0) {
    spansFromAPISentence.forEach(span => span.className = "");
  } else {
    // Si pas de phrase, en charger une
    getNewSentence();
  }

  // Ajouter l'écouteur d'événement
  textareaToTest.removeEventListener("input", handleTyping);
  textareaToTest.addEventListener("input", handleTyping);
  textareaToTest.focus();
}

function handleTyping(e) {
  if (!gameActive || locked) return;

  // Démarrer le timer au premier caractère tapé
  if (!timerID && textareaToTest.value.length === 1) {
    startTimer();
  }

  const completedSentence = checkSpans();

  if (completedSentence && spansFromAPISentence && spansFromAPISentence.length > 0) {
    locked = true;
    // Ajouter le score de la phrase complétée
    score += spansFromAPISentence.length;
    scoreDisplayed.textContent = `Score : ${score}`;
    // Charger une nouvelle phrase
    getNewSentence();
  }
}

function startTimer() {
  timerID = setInterval(() => {
    if (!gameActive) return;
    
    time--;
    timeDisplayed.textContent = `Temps : ${time}s`;

    if (time <= 0) {
      clearInterval(timerID);
      timerID = undefined;
      gameActive = false;
      
      timeDisplayed.classList.remove("active");
      textareaToTest.classList.remove("active");
      textareaToTest.disabled = true;
      textareaToTest.removeEventListener("input", handleTyping);
      
      // Message de fin
      setTimeout(() => {
        alert(`⏰ Temps écoulé !\n🎯 Votre score final est de ${score} points.\n\nAppuyez sur Échap pour rejouer !`);
      }, 100);
    }
  }, 1000);
}

function checkSpans() {
  if (!spansFromAPISentence || spansFromAPISentence.length === 0) {
    return false;
  }
  
  const textareaCharactersArray = textareaToTest.value.split("");
  let completedSentence = true;
  let currentGoodLetters = 0;

  for (let i = 0; i < spansFromAPISentence.length; i++) {
    if (textareaCharactersArray[i] === undefined) {
      spansFromAPISentence[i].className = "";
      completedSentence = false;
    } else if (textareaCharactersArray[i] === spansFromAPISentence[i].textContent) {
      spansFromAPISentence[i].classList.remove("wrong");
      spansFromAPISentence[i].classList.add("correct");
      currentGoodLetters++;
    } else {
      spansFromAPISentence[i].classList.add("wrong");
      spansFromAPISentence[i].classList.remove("correct");
      completedSentence = false;
    }
  }

  // Mettre à jour l'affichage du score en temps réel
  if (gameActive) {
    scoreDisplayed.textContent = `Score : ${score + currentGoodLetters}`;
  }
  
  return completedSentence;
}

// Ajouter un bouton pour forcer le chargement d'une nouvelle phrase
const refreshButton = document.createElement("button");
refreshButton.textContent = "🔄 Nouvelle phrase";
refreshButton.style.marginTop = "10px";
refreshButton.style.padding = "10px";
refreshButton.style.cursor = "pointer";
refreshButton.onclick = () => {
  getNewSentence();
  if (timerID) {
    // Si le jeu est en cours, on reset le score pour éviter la triche
    if (confirm("Changer de phrase pendant le jeu réinitialisera votre score. Continuer ?")) {
      resetGame();
    }
  } else {
    resetGame();
  }
};
document.querySelector(".container").appendChild(refreshButton);