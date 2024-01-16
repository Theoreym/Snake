// Def canvas, contexte
const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

// Taille d'une case du snake
const box = 20;

// Position du serpent départ
let snake = [{
  x: 10,
  y: 10
}];

// Direction du serpent départ
let direction = 'right';

// Dessiner le serpent
function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = (i === 0) ? '#4CAF50' : '#45a049'; // Couleur tête et corps
    ctx.fillRect(snake[i].x * box, snake[i].y * box, box, box);

    ctx.strokeStyle = '#fff'; // Bordures
    ctx.strokeRect(snake[i].x * box, snake[i].y * box, box, box);
  }
}

// Dessiner une pomme
function drawApple(apple) {
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(apple.x * box, apple.y * box, box, box);
}

// Dessiner le jeu
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessiner le serpent
  drawSnake();

  // Dessiner la pomme
  drawApple(apple);

  // Déplacement du serpent
  moveSnake();
}

// Déplacer le serpent
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

  // Ajout de la nouvelle tête
  snake.unshift(head);

  // Gestion de la collision avec la pomme
  if (head.x === apple.x && head.y === apple.y) {
    // Générer une nouvelle pomme
    generateApple();
  } else {
    // Supprimer la dernière partie du serpent
    snake.pop();
  }

  // Gestion de la collision avec les bords du canvas
  if (head.x < 0 || head.x * box >= canvas.width || head.y < 0 || head.y * box >= canvas.height) {
    // Réinitialiser le jeu en cas de collision
    resetGame();
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
  alert('Game Over!');

  // Réinitialiser la position initiale du serpent
  snake = [{
    x: 10,
    y: 10
  }];

  // Réinitialiser la direction
  direction = 'right';

  // Générer une nouvelle pomme
  generateApple();
}

// Générer la première pomme
let apple = {};
generateApple();

// Contrôles du serpent avec les touches du clavier
document.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowUp' && direction !== 'down') direction = 'up';
  else if (event.code === 'ArrowDown' && direction !== 'up') direction = 'down';
  else if (event.code === 'ArrowLeft' && direction !== 'right') direction = 'left';
  else if (event.code === 'ArrowRight' && direction !== 'left') direction = 'right';
});

// Boucle de jeu
setInterval(draw, 200);
