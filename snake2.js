// Sélection des éléments du DOM
let dom_replay = document.querySelector("#replay");
let dom_score = document.querySelector("#score");
let dom_canvas = document.createElement("canvas");
document.querySelector("#canvas").appendChild(dom_canvas);
let CTX = dom_canvas.getContext("2d");

// Constantes pour la taille du canvas
const W = (dom_canvas.width = 400);
const H = (dom_canvas.height = 400);

// Variables globales pour le jeu
let snake, snake2,
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
  key: "", // Store the current pressed key
  resetState() {
    // Réinitialise l'état de la touche
    this.key = "";
  },
  listen() {
    // Écoute des événements de pression de touches
    addEventListener(
      "keydown",
      (e) => {
        let key = e.key;
        if (key === "ArrowUp" && this.key === "ArrowDown") return;
        if (key === "ArrowDown" && this.key === "ArrowUp") return;
        if (key === "ArrowLeft" && this.key === "ArrowRight") return;
        if (key === "ArrowRight" && this.key === "ArrowLeft") return;
        this.key = key;
      },
      false
    );
  }
};

// Classe représentant le serpent
class Snake {
  constructor(index, color) {
    this.index = index;
    this.color = color;
    this.pos = new helpers.Vec(W / 2, H / 2);
    this.dir = new helpers.Vec(0, 0);
    this.size = W / cells;
    this.history = [];
    this.total = 1;
    this.delay = 5;
  }
  draw() {
    // Dessine le serpent sur le canvas
    let { x, y } = this.pos;
    CTX.fillStyle = this.color;
    CTX.shadowBlur = 20;
    CTX.shadowColor = "rgba(255,255,255,.3 )";
    CTX.fillRect(x, y, this.size, this.size);
    CTX.shadowBlur = 0;
    if (this.total >= 2) {
      for (let i = 0; i < this.history.length - 1; i++) {
        let { x, y } = this.history[i];
        CTX.lineWidth = 1;
        CTX.fillStyle = "rgba(225,225,225,1)";
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
    let dir = this.size;
  
    if (KEY.key === "z" || KEY.key === "Z" || KEY.key === "ArrowUp") {
      if (this.dir.y !== dir) {
        this.dir = new helpers.Vec(0, -dir);
      }
    }
    if (KEY.key === "s" || KEY.key === "S" || KEY.key === "ArrowDown") {
      if (this.dir.y !== -dir) {
        this.dir = new helpers.Vec(0, dir);
      }
    }
    if (KEY.key === "q" || KEY.key === "Q" || KEY.key === "ArrowLeft") {
      if (this.dir.x !== dir) {
        this.dir = new helpers.Vec(-dir, 0);
      }
    }
    if (KEY.key === "d" || KEY.key === "D" || KEY.key === "ArrowRight") {
      if (this.dir.x !== -dir) {
        this.dir = new helpers.Vec(dir, 0);
      }
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

// Fonction d'initialisation du jeu
function initialize() {
  // Initialisation du canvas et des écouteurs d'événements
  CTX.imageSmoothingEnabled = false;
  KEY.listen();
  cellsCount = cells * cells;
  cellSize = W / cells;
  // Création d'une instance de Snake et de Food
  snake1 = new Snake(0, "lime");  // Couleur du premier serpent (vert)
  snake2 = new Snake(1, "orange");  // Couleur du deuxième serpent (orange)
  food = new Food();
  // Ajout d'un gestionnaire d'événement pour le bouton de replay
  dom_replay.addEventListener("click", reset, false);
  // Lancement de la boucle de jeu
  loop();
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
    snake2.update();
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
  CTX.font = "bold 30px Poppins, sans-serif";
  CTX.fillText("GAME OVER", W / 2, H / 2);
  CTX.font = "15px Poppins, sans-serif";
  CTX.fillText(`SCORE   ${score}`, W / 2, H / 2 + 60);
  CTX.fillText(`MAXSCORE   ${maxScore}`, W / 2, H / 2 + 80);
}

// Fonction de réinitialisation du jeu
function reset() {
  // Réinitialise les éléments du jeu
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

// Lancement du jeu lors du chargement de la page
initialize();