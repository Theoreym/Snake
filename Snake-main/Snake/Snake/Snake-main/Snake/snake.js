// Définition du canvas et du contexte
const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

// Taille d'une case du serpent
const box = 20;

// Initialisation de la position du serpent
let snake = [{
  x: 10,
  y: 10
}];

// Initialisation de la direction du serpent
let direction = 'right';

// Variable pour la boucle de jeu
let gameLoop;

// Variable pour vérifier si le jeu est en pause
let gamePaused = false;

// Initialisation de la pomme
let apple = {};
generateApple();

// Initialisation du score et du meilleur score
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

// Affichage du score et du meilleur score
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');

// Contrôles du serpent avec les touches du clavier
document.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    togglePause();
  } else if (!gamePaused) {
    if (event.code === 'ArrowUp' && direction !== 'down') direction = 'up';
    else if (event.code === 'ArrowDown' && direction !== 'up') direction = 'down';
    else if (event.code === 'ArrowLeft' && direction !== 'right') direction = 'left';
    else if (event.code === 'ArrowRight' && direction !== 'left') direction = 'right';
  }
});

// Fonction principale pour dessiner le serpent
function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = (i === 0) ? '#4CAF50' : '#45a049'; // Couleur de tête et corps
    ctx.fillRect(snake[i].x * box, snake[i].y * box, box, box);

    ctx.strokeStyle = '#fff'; // Bordures
    ctx.strokeRect(snake[i].x * box, snake[i].y * box, box, box);
  }
}

// Fonction pour dessiner une pomme
function drawApple(apple) {
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(apple.x * box, apple.y * box, box, box);
}

// Fonction principale pour dessiner le jeu
function draw(paused) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessiner le serpent
  drawSnake();

  // Dessiner la pomme
  drawApple(apple);

  // Afficher le score
  scoreDisplay.innerHTML = 'Score: ' + score;
  highScoreDisplay.innerHTML = 'Meilleur score: ' + highScore;

  // Déplacement du serpent
  if (!paused) {
    moveSnake();
  }
}

// Fonction pour déplacer le serpent
function moveSnake() {
  let head = {
    x: snake[0].x,
    y: snake[0].y
  };

  // Gestion de la direction
  if (direction === 'right') head.x++;
  else if (direction === 'left') head.x--;
  else if (direction === 'up') head.y--;
  else if (direction === 'down') head.y++;

  // Vérification de la collision avec le corps du serpent
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      // Réinitialiser le jeu en cas de collision avec le corps du serpent
      resetGame();
      return;
    }
  }

  // Gestion de la collision avec les bords du canvas
  if (head.x < 0) {
    head.x = canvas.width / box - 1; // Réapparaitre à l'extrémité droite
  } else if (head.x * box >= canvas.width) {
    head.x = 0; // Réapparaitre à l'extrémité gauche
  } else if (head.y < 0) {
    head.y = canvas.height / box - 1; // Réapparaitre en bas
  } else if (head.y * box >= canvas.height) {
    head.y = 0; // Réapparaitre en haut
  }

  // Ajout de la nouvelle tête
  snake.unshift(head);

  // Gestion de la collision avec la pomme
  if (head.x === apple.x && head.y === apple.y) {
    // Générer une nouvelle pomme
    generateApple();

    // Augmenter le score
    score++;
  } else {
    // Supprimer la dernière partie du serpent
    snake.pop();
  }
}

// Fonction pour générer une nouvelle pomme de manière aléatoire
function generateApple() {
  apple = {
    x: Math.floor(Math.random() * (canvas.width / box)),
    y: Math.floor(Math.random() * (canvas.height / box))
  };

  // Vérifier que la nouvelle pomme n'est pas sur le serpent
  for (let i = 0; i < snake.length; i++) {
    if (apple.x === snake[i].x && apple.y === snake[i].y) {
      // Regénérer la pomme si elle est sur le serpent
      generateApple();
      return;
    }
  }
}

// Fonction de réinitialisation du jeu
function resetGame() {
  alert('Game Over! Votre score est de ' + score);

  // Mettre à jour le meilleur score si nécessaire
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }

  // Afficher le score et le meilleur score
  scoreDisplay.innerHTML = 'Score: ' + score;
  highScoreDisplay.innerHTML = 'Meilleur score: ' + highScore;

  // Réinitialiser la position initiale du serpent
  snake = [{
    x: 10,
    y: 10
  }];

  // Réinitialiser la direction
  direction = 'right';

  // Réinitialiser le score
  score = 0;

  // Générer une nouvelle pomme
  generateApple();
}

// Fonction pour mettre en pause le jeu
function togglePause() {
  gamePaused = !gamePaused;
  if (gamePaused) {
    clearInterval(gameLoop);
    showPauseMenu();
  } else {
    gameLoop = setInterval(function() {
      draw(gamePaused);
    }, 200);
    hidePauseMenu();
  }
}

// Fonction pour afficher le menu de pause
function showPauseMenu() {
  // Afficher le menu de pause (mettez à jour le HTML/CSS en conséquence)
  // par exemple, en ajoutant ou en modifiant une classe CSS
  // pour rendre visible le menu de pause
  // Assurez-vous de fournir des options pour les paramètres, les meilleurs scores, et la reprise du jeu.
}

// Fonction pour cacher le menu de pause
function hidePauseMenu() {
  // Cacher le menu de pause
}

// Générer la première pomme
generateApple();

// Boucle de jeu
gameLoop = setInterval(function() {
  draw(gamePaused);
}, 200);