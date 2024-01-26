// Déclaration d'une constante "letters" contenant l'alphabet en majuscules
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Déclaration d'une variable "interval" initialisée à null
let interval = null;

// Ajout d'un gestionnaire d'événement sur la surbrillance (mouseover) du bouton
document.querySelector("button").onmouseover = event => {
  // Initialisation de la variable "iteration" à 0
  let iteration = 0;

  // Effacement de l'intervalle actuel (s'il existe déjà)
  clearInterval(interval);

  // Définition d'un nouvel intervalle utilisant la fonction setInterval
  interval = setInterval(() => {
    // Modification du texte du bouton à chaque itération
    event.target.innerText = event.target.innerText
      .split("")
      .map((letter, index) => {
        // Remplacement des lettres précédentes par celles d'origine
        if (index < iteration) {
          return event.target.dataset.value[index];
        }

        // Sélection aléatoire d'une lettre de l'alphabet pour les caractères restants
        return letters[Math.floor(Math.random() * 26)];
      })
      .join("");

    // Arrêt de l'animation lorsque toutes les lettres d'origine ont été affichées
    if (iteration >= event.target.dataset.value.length) {
      clearInterval(interval);
    }

    // Incrémentation de "iteration" pour la prochaine itération de l'animation
    iteration += 1 / 3;
  }, 30); // L'animation est mise à jour toutes les 30 millisecondes
}