// Sélection des éléments du DOM
let dom_replay = document.querySelector("#replay");
let dom_score = document.querySelector("#score");
let dom_canvas = document.createElement("canvas");
document.querySelector("#canvas").appendChild(dom_canvas);
let CTX = dom_canvas.getContext("2d");

// Constantes pour la taille du canvas
const W = (dom_canvas.width = 400);
const H = (dom_canvas.height = 400);

//fonction temps

var startTime;
var elapsedTime = 0;
var timerId;
let finalElapsedTime;

// Function to update the stopwatch display
function updateStopwatchDisplay() {
  const currentTime = new Date().getTime();
  elapsedTime = currentTime - startTime;
  const formattedTime = formatTime(elapsedTime);
  document.getElementById("stopwatch").innerText = formattedTime;
  timerId = requestAnimationFrame(updateStopwatchDisplay);
}

// fonction pour lancer le temps
function startStopwatch() {
  startTime = new Date().getTime();
  updateStopwatchDisplay();
}

// fonction pour formater le temps correctement (00:00:00)
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const formattedHours = padNumber(hours);
  const formattedMinutes = padNumber(minutes % 60);
  const formattedSeconds = padNumber(seconds % 60);

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// fonction pour toujours avoir un format 00:00:00 même avec des chiffres inférieurs à 10 -> ne pas avoir 00:00:9 par exemple
function padNumber(number) {
  return number < 10 ? "0" + number : number;
}

// fonction d'arrêt du temps
function stopStopwatch() {
  cancelAnimationFrame(timerId);
  const finalElapsedTime = new Date().getTime() - startTime;
  startTime = null;
  return finalElapsedTime;
}

// fonction pour remettre le temps à zéro
function resetStopwatch() {
  cancelAnimationFrame(timerId);
  startTime = new Date().getTime();
  elapsedTime = 0;
  updateStopwatchDisplay();
}

// Variables globales pour le jeu
let snake,
  food,
  currentHue,
  cells = 20,
  cellSize,
  isGameOver = false,
  tails = [],
  score = 0,
  maxScore = window.localStorage.getItem("maxScore") || undefined,
  particles = [],
  splashingParticleCount = 20,
  cellsCount,
  requestID;

// Objet utilitaire contenant des méthodes utiles
let helpers = {
  Vec: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }
    mult(v) {
      if (v instanceof helpers.Vec) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
      } else {
        this.x *= v;
        this.y *= v;
        return this;
      }
    }
  },
  isCollision(v1, v2) {
    return v1.x == v2.x && v1.y == v2.y;
  },
  garbageCollector() {
    // Supprime les particules dont la taille est nulle
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].size <= 0) {
        particles.splice(i, 1);
      }
    }
  },
  drawGrid() {
    // Dessine une grille sur le canvas
    CTX.lineWidth = 1.1;
    CTX.strokeStyle = "#232332";
    CTX.shadowBlur = 0;
    for (let i = 1; i < cells; i++) {
      let f = (W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(f, 0);
      CTX.lineTo(f, H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(W, f);
      CTX.stroke();
      CTX.closePath();
    }
  },
  randHue() {
    // Génère une valeur de teinte aléatoire
    return ~~(Math.random() * 360);
  },
  hsl2rgb(hue, saturation, lightness) {
    // Convertit une couleur HSL en RGB
    if (hue == undefined) {
      return [0, 0, 0];
    }
    // Calcul des composantes RGB
    var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    var huePrime = hue / 60;
    var secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));

    huePrime = ~~huePrime;
    var red;
    var green;
    var blue;

    if (huePrime === 0) {
      red = chroma;
      green = secondComponent;
      blue = 0;
    } else if (huePrime === 1) {
      red = secondComponent;
      green = chroma;
      blue = 0;
    } else if (huePrime === 2) {
      red = 0;
      green = chroma;
      blue = secondComponent;
    } else if (huePrime === 3) {
      red = 0;
      green = secondComponent;
      blue = chroma;
    } else if (huePrime === 4) {
      red = secondComponent;
      green = 0;
      blue = chroma;
    } else if (huePrime === 5) {
      red = chroma;
      green = 0;
      blue = secondComponent;
    }

    var lightnessAdjustment = lightness - chroma / 2;
    red += lightnessAdjustment;
    green += lightnessAdjustment;
    blue += lightnessAdjustment;

    return [
      Math.round(red * 255),
      Math.round(green * 255),
      Math.round(blue * 255)
    ];
  },
  lerp(start, end, t) {
    // Interpolation linéaire entre deux valeurs
    return start * (1 - t) + end * t;
  }
};

// Objet pour gérer les états des touches clavier
let KEY = {
  ArrowUp: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowLeft: false,
  resetState() {
    // Réinitialise les états des touches
    this.ArrowUp = false;
    this.ArrowRight = false;
    this.ArrowDown = false;
    this.ArrowLeft = false;
  },
  listen() {
    // Écoute des événements de pression de touches
    addEventListener(
      "keydown",
      (e) => {
        if (e.key === "ArrowUp" && this.ArrowDown) return;
        if (e.key === "ArrowDown" && this.ArrowUp) return;
        if (e.key === "ArrowLeft" && this.ArrowRight) return;
        if (e.key === "ArrowRight" && this.ArrowLeft) return;
        this[e.key] = true;
        // Désactive les autres touches
        Object.keys(this)
          .filter((f) => f !== e.key && f !== "listen" && f !== "resetState")
          .forEach((k) => {
            this[k] = false;
          });
      },
      false
    );
  }
};

// Classe représentant le serpent
class Snake {
  constructor(i, type) {
    // Initialisation des propriétés du serpent
    this.pos = new helpers.Vec(W / 2, H / 2);
    this.dir = new helpers.Vec(0, 0);
    this.type = type;
    this.index = i;
    this.delay = 5;
    this.size = W / cells;
    this.history = [];
    this.total = 1;
  }
  draw() {
    // Dessine le serpent sur le canvas
    let { x, y } = this.pos;
    CTX.fillStyle = skin;
    CTX.shadowBlur = 20;
    CTX.shadowColor = skin;
    CTX.fillRect(x, y, this.size, this.size);
    CTX.shadowBlur = 0;

    // Dessine deux yeux
    const eyeRadius = 3; // Taille des yeux

    // Positionnement des yeux
    const leftEyeX = x + this.size * 0.25;
    const rightEyeX = x + this.size * 0.75;
    const eyeY = y + this.size * 0.25;

    // Oeil gauche
    CTX.fillStyle = "black";
    CTX.beginPath();
    CTX.arc(leftEyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
    CTX.fill();

    // Oeil droite
    CTX.beginPath();
    CTX.arc(rightEyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
    CTX.fill();

    // Sourire
    const smileRadius = this.size * 0.3; // You can adjust the size of the smile
    const smileCenterX = x + this.size * 0.5;
    const smileCenterY = y + this.size * 0.5;

    CTX.beginPath();
    CTX.arc(smileCenterX, smileCenterY, smileRadius, 0, Math.PI);
    CTX.stroke();

    if (this.total >= 2) {

      let { x, y } = this.history[0];
      CTX.fillStyle = skin;
      CTX.fillRect(x, y, this.size, this.size);

      CTX.strokeStyle = "#000000"; // Couleur de la croix
      CTX.lineWidth = 2;

      CTX.beginPath();
      CTX.moveTo(x + this.size / 4, y + this.size / 4);
      CTX.lineTo(x + 3 * this.size / 4, y + 3 * this.size / 4);
      CTX.stroke();

      CTX.beginPath();
      CTX.moveTo(x + this.size / 4, y + 3 * this.size / 4);
      CTX.lineTo(x + 3 * this.size / 4, y + this.size / 4);
      CTX.stroke();


      for (let i = 1; i < this.history.length - 1; i++) {
        let { x, y } = this.history[i];
        CTX.lineWidth = 1;
        CTX.fillStyle = skin;
        CTX.shadowBlur = 0;
        CTX.fillRect(x, y, this.size, this.size);
      }
    }
  }
  walls() {
    // Gère les collisions avec les bords du canvas
    let { x, y } = this.pos;
    if (x + cellSize > W) {
      this.pos.x = 0;
    }
    if (y + cellSize > W) {
      this.pos.y = 0;
    }
    if (y < 0) {
      this.pos.y = H - cellSize;
    }
    if (x < 0) {
      this.pos.x = W - cellSize;
    }
  }
  controlls() {
    // Gère les contrôles du serpent
    let dir = this.size;

    // Check la direction du snake
    const isMovingUp = this.dir.y < 0;
    const isMovingDown = this.dir.y > 0;
    const isMovingLeft = this.dir.x < 0;
    const isMovingRight = this.dir.x > 0;

    if (KEY.ArrowUp && !isMovingDown) {
      this.dir = new helpers.Vec(0, -dir);
    }
    if (KEY.ArrowDown && !isMovingUp) {
      this.dir = new helpers.Vec(0, dir);
    }
    if (KEY.ArrowLeft && !isMovingRight) {
      this.dir = new helpers.Vec(-dir, 0);
    }
    if (KEY.ArrowRight && !isMovingLeft) {
      this.dir = new helpers.Vec(dir, 0);
    }
  }

  selfCollision() {
    // Gère la collision du serpent avec lui-même
    for (let i = 0; i < this.history.length; i++) {
      let p = this.history[i];
      if (helpers.isCollision(this.pos, p)) {
        isGameOver = true;
      }
    }
  }
  update() {
    // Met à jour la position du serpent
    this.walls();
    this.draw();
    this.controlls();
    if (!this.delay--) {
      if (helpers.isCollision(this.pos, food.pos)) {
        incrementScore();
        particleSplash();
        food.spawn();
        this.total++;
      }
      this.history[this.total - 1] = new helpers.Vec(this.pos.x, this.pos.y);
      for (let i = 0; i < this.total - 1; i++) {
        this.history[i] = this.history[i + 1];
      }
      this.pos.add(this.dir);
      this.delay = 5;
      this.total > 3 ? this.selfCollision() : null;
    }
  }
}

// Classe représentant la nourriture
class Food {
  constructor() {
    // Initialisation des propriétés de la nourriture
    this.pos = new helpers.Vec(
      ~~(Math.random() * cells) * cellSize,
      ~~(Math.random() * cells) * cellSize
    );
    this.color = currentHue = `hsl(${~~(Math.random() * 360)},100%,50%)`;
    this.size = cellSize;
  }
  draw() {
    // Dessine la nourriture sur le canvas
    let { x, y } = this.pos;
    CTX.globalCompositeOperation = "lighter";
    CTX.shadowBlur = 20;
    CTX.shadowColor = this.color;
    CTX.fillStyle = this.color;
    CTX.fillRect(x, y, this.size, this.size);
    CTX.globalCompositeOperation = "source-over";
    CTX.shadowBlur = 0;

    CTX.fillStyle = "white";
    CTX.beginPath();
    CTX.moveTo(x + this.size / 8, y - this.size / 2); // Top point
    CTX.lineTo(x + this.size / 8, y - this.size / 8);               // Bottom-left point
    CTX.lineTo(x + this.size / 2, y);         // Bottom-right point
    CTX.fill();
  }
  spawn() {
    // Place la nourriture à une position aléatoire
    let randX = ~~(Math.random() * cells) * this.size;
    let randY = ~~(Math.random() * cells) * this.size;
    for (let path of snake.history) {
      if (helpers.isCollision(new helpers.Vec(randX, randY), path)) {
        return this.spawn();
      }
    }
    this.color = currentHue = `hsl(${helpers.randHue()}, 100%, 50%)`;
    this.pos = new helpers.Vec(randX, randY);
  }
}

// Classe représentant une particule
class Particle {
  constructor(pos, color, size, vel) {
    // Initialisation des propriétés de la particule
    this.pos = pos;
    this.color = color;
    this.size = Math.abs(size / 2);
    this.ttl = 0;
    this.gravity = -0.2;
    this.vel = vel;
  }
  draw() {
    // Dessine la particule sur le canvas
    let { x, y } = this.pos;
    let hsl = this.color
      .split("")
      .filter((l) => l.match(/[^hsl()$% ]/g))
      .join("")
      .split(",")
      .map((n) => +n);
    let [r, g, b] = helpers.hsl2rgb(hsl[0], hsl[1] / 100, hsl[2] / 100);
    CTX.shadowColor = `rgb(${r},${g},${b},${1})`;
    CTX.shadowBlur = 0;
    CTX.globalCompositeOperation = "lighter";
    CTX.fillStyle = `rgb(${r},${g},${b},${1})`;
    CTX.fillRect(x, y, this.size, this.size);
    CTX.globalCompositeOperation = "source-over";
  }
  update() {
    // Met à jour la particule
    this.draw();
    this.size -= 0.3;
    this.ttl += 1;
    this.pos.add(this.vel);
    this.vel.y -= this.gravity;
  }
}

// Fonction d'incrémentation du score
function incrementScore() {
  // Incrémente le score
  score++;
  dom_score.innerText = score.toString().padStart(2, "0");
}

// Fonction de génération de particules lors d'une collision avec la nourriture
function particleSplash() {
  for (let i = 0; i < splashingParticleCount; i++) {
    let vel = new helpers.Vec(Math.random() * 6 - 3, Math.random() * 6 - 3);
    let position = new helpers.Vec(food.pos.x, food.pos.y);
    particles.push(new Particle(position, currentHue, food.size, vel));
  }
}

// Fonction pour effacer le canvas
function clear() {
  CTX.clearRect(0, 0, W, H);
}

function choice(couleur) {
  switch (couleur) {
    case 1:
      //bleu
      skin = "#11fffb";
      break;
    case 2:
      //rouge
      skin = "#ff3f33";
      break;
    case 3:
      //jaune
      skin = "#fcff33";
      break;
    case 4:
      //orange
      skin = "Orange";
      break;
    case 5:
      //blanc
      skin = "#ffffff";
      break;
    default:
      //vert par défaut
      skin = "#1fff11";
      break;
  }
}

// Fonction d'initialisation du jeu
function initialize() {
  // Initialisation du canvas et des écouteurs d'événements
  CTX.imageSmoothingEnabled = false;
  KEY.listen();
  cellsCount = cells * cells;
  cellSize = W / cells;
  // Création d'une instance de Snake et de Food
  //création d'une instance de snake en blocs color
  choice();



  snake = new Snake();

  food = new Food();
  // Ajout d'un gestionnaire d'événement pour le bouton de replay
  dom_replay.addEventListener("click", reset, false);
  // Lancement de la boucle de jeu
  loop();
  startStopwatch();

  // Ecoute de mouvements de doigt sur l'écran en version mobile
  dom_canvas.addEventListener("touchstart", handleTouchStart, false);
  dom_canvas.addEventListener("touchmove", handleTouchMove, false);
  dom_canvas.addEventListener("touchend", handleTouchEnd, false);
}

// Boucle principale du jeu
function loop() {
  // Effacement du canvas
  clear();
  if (!isGameOver) {
    // Si le jeu n'est pas terminé, continue la boucle de jeu
    requestID = setTimeout(loop, 1000 / 60);
    // Dessine la grille, met à jour le serpent et la nourriture, gère les particules
    helpers.drawGrid();
    snake.update();
    food.draw();
    for (let p of particles) {
      p.update();
    }
    // Supprime les particules inutiles
    helpers.garbageCollector();
  } else {
    // Si le jeu est terminé, affiche l'écran de fin de jeu
    clear();
    gameOver();
  }
}

// Fonction affichant l'écran de fin de jeu
function gameOver() {
  // Gestion du meilleur score
  maxScore ? null : (maxScore = score);
  score > maxScore ? (maxScore = score) : null;
  window.localStorage.setItem("maxScore", maxScore);
  // Affichage des informations de fin de jeu
  CTX.fillStyle = "#4cffd7";
  CTX.textAlign = "center";
  CTX.font = "bold 30px 'Cascadia Code', sans-serif";
  CTX.fillText("GAME OVER", W / 2, H / 2);
  CTX.font = "15px Poppins, sans-serif";
  CTX.fillText(`SCORE   ${score}`, W / 2, H / 2 + 60);
  CTX.fillText(`MAXSCORE   ${maxScore}`, W / 2, H / 2 + 80);

  //arrêt du temps
  stopStopwatch();

  // Montre le temps passé dans la partie
  var formattedFinalTime = document.querySelector("#stopwatch").innerHTML;
  CTX.fillText(`TIME   ${formattedFinalTime}`, W / 2, H / 2 + 100);

  //récupération du score final
  var finalScore = score;
  //ajout au tableau
  add(nom, finalScore, formattedFinalTime);

}

// Fonction de réinitialisation du jeu
function reset() {
  // Réinitialise les éléments du jeu

  //réinitialise le temps
  resetStopwatch();

  dom_score.innerText = "00";
  score = "00";
  snake = new Snake();
  food.spawn();
  KEY.resetState();
  isGameOver = false;
  clearTimeout(requestID);
  // Relance la boucle de jeu
  loop();
}

// Lancement du jeu lorsque le nom est rentré
function Launch() {  
  nom = document.querySelector("#zoneNom").value;  
  initialize();
}

// Gestion des mouvements de doigt sur mobile

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event) {
  handleTouchMove(event); // Immediately handle the initial touch position
}

function handleTouchMove(event) {
  const touchX = event.touches[0].clientX;
  const touchY = event.touches[0].clientY;

  const canvasRect = dom_canvas.getBoundingClientRect();
  const canvasX = touchX - canvasRect.left;
  const canvasY = touchY - canvasRect.top;

  const cellWidth = W / cells;
  const cellHeight = H / cells;

  const col = Math.floor(canvasX / cellWidth);
  const row = Math.floor(canvasY / cellHeight);

  // Reset snake direction
  KEY.resetState();

  // Determine the touched zone and set the corresponding direction
  if (col < cells / 3) {
    // Left zone
    KEY.ArrowLeft = true;
  } else if (col > (2 * cells) / 3) {
    // Right zone
    KEY.ArrowRight = true;
  } else {
    // Middle zone, check vertical direction
    if (row < cells / 2) {
      // Top zone
      KEY.ArrowUp = true;
    } else {
      // Bottom zone
      KEY.ArrowDown = true;
    }
  }
}

function handleTouchEnd() {
  // Reset snake direction when touch ends
  KEY.resetState();
}

function add(nom, points, temps) {
  let nouvelleLigne = tableau.insertRow(-1);

  nouvelleLigne.insertCell(0).textContent = nom;
  nouvelleLigne.insertCell(1).textContent = points;
  nouvelleLigne.insertCell(2).textContent = temps;

}

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
} 