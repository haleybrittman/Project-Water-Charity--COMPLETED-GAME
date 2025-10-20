// 🎮 DOM ELEMENTS
// Player image for jerry can
const playerImg = new Image();
playerImg.src = "jerrycan2.png";
// Preserve aspect ratio when sizing the player image
playerImg.onload = () => {
  const ratio = playerImg.naturalHeight / playerImg.naturalWidth || 1;
  player.height = Math.round(player.width * ratio);
};
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const pauseMenu = document.getElementById("pause-menu");
const gameOver = document.getElementById("game-over");

const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const restartBtn = document.getElementById("restart-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const menuBtn = document.getElementById("menu-btn");


const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// 🎯 GAME STATE VARIABLES
let score = 0;
let lives = 4;
let isPaused = false;
let isPlaying = false;
let drops = [];
let player = { x: 370, y: 550, width: 70, height: 70 };

// 🌟 DIFFICULTY VARIABLES
let difficulty = "normal";
let dropSpeed = 3;
let pollutantChance = 0.3;

// 💧 DROP VISUAL SETTINGS
// Make clean water droplets larger to be easier to catch
const CLEAN_DROP_RADIUS = 16;
const POLLUTANT_DROP_RADIUS = 10;

// 🧩 DOM ELEMENTS FOR UI
const scoreDisplay = document.createElement("div");
scoreDisplay.id = "score-display";
scoreDisplay.textContent = `Score: ${score}`;
gameContainer.appendChild(scoreDisplay);

const livesDisplay = document.createElement("div");
livesDisplay.id = "lives-display";
livesDisplay.textContent = `Lives: ${lives}`;
gameContainer.appendChild(livesDisplay);

const difficultyDisplay = document.createElement("div");
difficultyDisplay.id = "difficulty-display";
difficultyDisplay.textContent = `Mode: ${difficulty.toUpperCase()}`;
gameContainer.appendChild(difficultyDisplay);

// 💧 CREATE RANDOM DROPS
function createDrop() {
  const isPollutant = Math.random() < pollutantChance;
  const radius = isPollutant ? POLLUTANT_DROP_RADIUS : CLEAN_DROP_RADIUS;
  // Spawn fully on-screen based on droplet radius
  const x = radius + Math.random() * (canvas.width - 2 * radius);

  const drop = {
    x,
    y: 0,
    radius,
    isPollutant: isPollutant,
    color: isPollutant ? "#6b4f4f" : "#00bfff",
  };

  drops.push(drop);
}

// ✨ DRAW PLAYER + DROPS
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw player as jerry can image
  // Use high-quality smoothing when downscaling to reduce blur
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // draw drops
  drops.forEach((drop) => {
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
    ctx.fillStyle = drop.color;
    ctx.fill();

    if (drop.isPollutant) {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// 🎮 UPDATE GAME STATE
function update() {
  if (isPaused || !isPlaying) return;

  drops.forEach((drop, i) => {
    drop.y += dropSpeed; // fall speed depends on difficulty

    // check collision with player
    if (
      drop.y + drop.radius > player.y &&
      drop.x > player.x &&
      drop.x < player.x + player.width
    ) {
      if (drop.isPollutant) {
        // 😷 caught pollutant — lose life
        lives--;
        updateLives();
        flashCanvas("rgba(255, 50, 50, 0.4)");
        if (lives <= 0) {
          endGame();
          return;
        }
      } else {
        // 💧 caught clean water — gain score
        score++;
        updateScore();
        flashCanvas("rgba(50, 255, 50, 0.4)");
      }

      drops.splice(i, 1);
      createDrop();
    }

    // missed drop
    if (drop.y > canvas.height) {
      drops.splice(i, 1);
      createDrop();

      if (!drop.isPollutant) {
        lives--;
        updateLives();
        flashCanvas("rgba(255, 50, 50, 0.4)");
        if (lives <= 0) {
          endGame();
          return;
        }
      }
    }
  });

  draw();
  requestAnimationFrame(update);
}

// ⚡ FLASH EFFECT FOR FEEDBACK
function flashCanvas(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setTimeout(draw, 100);
}

// 💥 UPDATE SCORE
function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
  scoreDisplay.classList.add("score-bounce");

  scoreDisplay.style.color = "#ffcc00";
  setTimeout(() => {
    scoreDisplay.classList.remove("score-bounce");
    scoreDisplay.style.color = "#fff";
  }, 200);
}

// ❤️ UPDATE LIVES
function updateLives() {
  livesDisplay.textContent = `Lives: ${lives}`;
  livesDisplay.classList.add("lives-flash");
  setTimeout(() => livesDisplay.classList.remove("lives-flash"), 200);
}

// 💀 END GAME
function endGame() {
  isPlaying = false;
  gameContainer.classList.remove("active");
  gameOver.classList.add("active");
}

// 🕹️ MOVE PLAYER
document.addEventListener("keydown", (e) => {
  if (!isPlaying) return;
  const moveSpeed = 40; // Increased speed
  if (e.key === "ArrowLeft" && player.x > 0) player.x -= moveSpeed;
  if (e.key === "ArrowRight" && player.x < canvas.width - player.width)
    player.x += moveSpeed;
  // Prevent player from clipping below the canvas
  if (player.y + player.height > canvas.height) {
    player.y = canvas.height - player.height;
  }
});

// 🔘 BUTTON HANDLERS
pauseBtn.addEventListener("click", () => {
  isPaused = true;
  pauseMenu.classList.add("active");
});

resumeBtn.addEventListener("click", () => {
  isPaused = false;
  pauseMenu.classList.remove("active");
  update();
});

restartBtn.addEventListener("click", restartGame);
playAgainBtn.addEventListener("click", restartGame);

menuBtn.addEventListener("click", () => {
  isPlaying = false;
  isPaused = false;
  pauseMenu.classList.remove("active");
  gameContainer.classList.remove("active");
  startScreen.classList.add("active");
});

// 🌟 DIFFICULTY BUTTON LOGIC
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    difficulty = btn.dataset.mode;

    if (difficulty === "easy") {
      dropSpeed = 2.5;
      pollutantChance = 0.25;
    } else if (difficulty === "normal") {
      dropSpeed = 4;
      pollutantChance = 0.4;
    } else if (difficulty === "hard") {
      dropSpeed = 5.5;
      pollutantChance = 0.55;
    }

    // Hide start screen and begin game
    startScreen.classList.remove("active");
    gameContainer.classList.add("active");
    startGame();
  });
});

// 🔄 GAME FUNCTIONS
function startGame() {
  isPlaying = true;
  score = 0;
  lives = 4;
  player.x = 370;
  updateLives();
  updateScore();
  drops = [];
  for (let i = 0; i < 3; i++) createDrop();
  difficultyDisplay.textContent = `Mode: ${difficulty.toUpperCase()}`;
  update();
}

function restartGame() {
  pauseMenu.classList.remove("active");
  gameOver.classList.remove("active");
  gameContainer.classList.add("active");
  startGame();
}
