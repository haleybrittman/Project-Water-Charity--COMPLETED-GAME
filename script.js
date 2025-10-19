// 🎮 DOM ELEMENTS
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const pauseMenu = document.getElementById("pause-menu");
const gameOver = document.getElementById("game-over");

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const restartBtn = document.getElementById("restart-btn");
const playAgainBtn = document.getElementById("play-again-btn");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// 🎯 GAME STATE VARIABLES
let score = 0;
let isPaused = false;
let isPlaying = false;
let drops = [];
let player = { x: 370, y: 550, width: 60, height: 30 };

// 🎲 SETUP SCORE DISPLAY
const scoreDisplay = document.createElement("div");
scoreDisplay.id = "score-display";
scoreDisplay.textContent = `Score: ${score}`;
gameContainer.appendChild(scoreDisplay);

// 💧 CREATE RANDOM DROPS
function createDrop() {
  const x = Math.random() * (canvas.width - 20);
  drops.push({ x, y: 0, radius: 10, color: "#00bfff" }); // blue = clean water
}

// ✨ DRAW PLAYER + DROPS
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw player
  ctx.fillStyle = "#ffff00";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // draw drops
  drops.forEach((drop) => {
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
    ctx.fillStyle = drop.color;
    ctx.fill();
  });
}

// 🎮 UPDATE GAME STATE
function update() {
  if (isPaused || !isPlaying) return;

  drops.forEach((drop, i) => {
    drop.y += 3; // fall speed
    // check collision with player
    if (
      drop.y + drop.radius > player.y &&
      drop.x > player.x &&
      drop.x < player.x + player.width
    ) {
      // caught!
      score++;
      updateScore();
      drops.splice(i, 1);
      createDrop(); // add a new one
    }
    // missed drop
    if (drop.y > canvas.height) {
      drops.splice(i, 1);
      createDrop();
    }
  });

  draw();
  requestAnimationFrame(update);
}

// 💥 UPDATE SCORE + FEEDBACK
function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
  scoreDisplay.classList.add("score-bounce");

  // visual flash effect
  scoreDisplay.style.color = "#ffcc00";
  setTimeout(() => {
    scoreDisplay.classList.remove("score-bounce");
    scoreDisplay.style.color = "#fff";
  }, 200);
}

// 🕹️ MOVE PLAYER
document.addEventListener("keydown", (e) => {
  if (!isPlaying) return;
  if (e.key === "ArrowLeft" && player.x > 0) player.x -= 20;
  if (e.key === "ArrowRight" && player.x < canvas.width - player.width)
    player.x += 20;
});

// 🧩 BUTTON HANDLERS
startBtn.addEventListener("click", () => {
  startScreen.classList.remove("active");
  gameContainer.classList.add("active");
  startGame();
});

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

// 🔄 GAME FUNCTIONS
function startGame() {
  isPlaying = true;
  score = 0;
  updateScore();
  drops = [];
  for (let i = 0; i < 3; i++) createDrop();
  update();
}

function restartGame() {
  pauseMenu.classList.remove("active");
  gameOver.classList.remove("active");
  startGame();
}
