// 🎮 DOM ELEMENTS
// Player image for jerry can
const playerImg = new Image();
playerImg.src = "jerrycan.png";
// Preserve aspect ratio when sizing the player image
playerImg.onload = () => {
  const ratio = playerImg.naturalHeight / playerImg.naturalWidth || 1;
  player.height = Math.round(player.width * ratio);
};
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const pauseMenu = document.getElementById("pause-menu");
const gameOver = document.getElementById("game-over");
// Level complete overlay elements
const levelComplete = document.getElementById("level-complete");
const levelMessage = document.getElementById("level-message");
const factText = document.getElementById("fact-text");
const nextLevelBtn = document.getElementById("next-level-btn");

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
let player = { x: 370, y: 480, width: 70, height: 70 };
// Levels
let level = 1;
const maxLevels = 2;
let targetScore = 0;
// Timer
let timeRemaining = 25;
let timerInterval = null;

// 🌟 DIFFICULTY VARIABLES
let difficulty = "normal";
let dropSpeed = 3;
let pollutantChance = 0.3;
let baseDropSpeed = dropSpeed;
let basePollutantChance = pollutantChance;

// 💧 DROP VISUAL SETTINGS
// 🎉 MILESTONE MESSAGES
const MILESTONES = [
  { score: 5, message: "Nice start!" },
  { score: 10, message: "Halfway there!" },
  { score: 15, message: "Almost done!" },
  { score: 20, message: "Amazing! You reached 20 points!" }
];

const MILESTONE_DURATION_MS = 2500;
let shownMilestones = new Set();
let milestoneShowing = false;
let milestonePromise = null;

function showMilestoneMessage(msg) {
  const milestoneDiv = document.createElement("div");
  milestoneDiv.className = "milestone-message";
  milestoneDiv.textContent = msg;
  gameContainer.appendChild(milestoneDiv);

  milestoneShowing = true;
  milestonePromise = new Promise((resolve) => {
    setTimeout(() => {
      milestoneDiv.remove();
      milestoneShowing = false;
      resolve();
    }, MILESTONE_DURATION_MS);
  });
  return milestonePromise;
}
// Make clean water droplets larger to be easier to catch
const CLEAN_DROP_RADIUS = 16;
const POLLUTANT_DROP_RADIUS = 16;

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

// Timer display
const timerDisplay = document.createElement("div");
timerDisplay.id = "timer-display";
timerDisplay.textContent = `Time: ${timeRemaining}s`;
gameContainer.appendChild(timerDisplay);

// Quick facts to show between levels
const WATER_FACTS = [
  "1 in 10 people lack access to clean water.",
  "Women and girls are responsible for water collection in 7 out of 10 households with water off premises. When a community gets water, women and girls get their lives back. They start businesses, improve their homes, and take charge of their own futures.",
  "Clean water helps keep kids in school, especially girls. Less time collecting water means more time in class. Clean water and proper toilets at school means teenage girls don’t have to stay home for a week out of every month."
];

function setTargetScore() {
  // Level 1: 5, Level 2: 10
  if (level === 1) {
    targetScore = 5;
  } else {
    targetScore = 10;
  }
}

function applyLevelScaling() {
  // Scale speed and pollutants with level while capping pollutant chance
  const lvlIdx = level - 1;
  const speedBump = difficulty === "easy" ? 0.5 : difficulty === "normal" ? 0.7 : 1.0;
  const pollBump = difficulty === "easy" ? 0.05 : difficulty === "normal" ? 0.08 : 0.10;
  dropSpeed = baseDropSpeed + lvlIdx * speedBump;
  pollutantChance = Math.min(0.85, basePollutantChance + lvlIdx * pollBump);
}

function completeLevel() {
  isPlaying = false;
  clearInterval(timerInterval);
  levelMessage.textContent = `Level ${level} Completed!`;
  const fact = WATER_FACTS[(level - 1) % WATER_FACTS.length];
  factText.textContent = `💧 Did you know? ${fact}`;
  levelComplete.classList.add("active");
  // Set button label depending on remaining levels
  nextLevelBtn.textContent = level < maxLevels ? "Next Level →" : "Play Again";
}

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
        // Check level target — show milestone first if it coincides
        if (isPlaying && score >= targetScore) {
          // Pause gameplay while awaiting milestone popup (if any)
          if (milestoneShowing && milestonePromise) {
            isPlaying = false;
            milestonePromise.then(() => {
              // Guard: ensure game still in a state to complete level
              completeLevel();
            });
          } else {
            completeLevel();
          }
          return;
        }
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

  // Show milestone messages
  MILESTONES.forEach(m => {
    if (score === m.score && !shownMilestones.has(m.score)) {
      showMilestoneMessage(m.message);
      shownMilestones.add(m.score);
    }
  });

  // Regain a life every 3 clean drops, up to max (4)
  if (score > 0 && score % 3 === 0 && lives < 4) {
    lives++;
    updateLives();
    livesDisplay.classList.add("lives-flash");
    setTimeout(() => livesDisplay.classList.remove("lives-flash"), 400);
  }

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
  clearInterval(timerInterval);
  gameContainer.classList.remove("active");
  gameOver.classList.add("active");
}

  // Reset milestone tracking
  shownMilestones.clear();
  milestoneShowing = false;
  milestonePromise = null;
// ⏰ TIMER FUNCTIONS
function startTimer() {
  timeRemaining = 25;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused && isPlaying) {
      timeRemaining--;
      updateTimer();
      if (timeRemaining <= 0) {
        endGame();
      }
    }
  }, 1000);
}

function updateTimer() {
  timerDisplay.textContent = `Time: ${timeRemaining}s`;
  if (timeRemaining <= 5) {
    timerDisplay.style.color = "#ff4d4d";
  } else {
    timerDisplay.style.color = "#fff";
  }
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

// Next level button
nextLevelBtn.addEventListener("click", () => {
  levelComplete.classList.remove("active");
  if (level < maxLevels) {
    level++;
    // Apply new scaling and reset level state
    applyLevelScaling();
    setTargetScore();
    // Reset per-level state
    score = 0;
    updateScore();
    drops = [];
    for (let i = 0; i < 3; i++) createDrop();
    isPlaying = true;
    startTimer();
    update();
  } else {
    // After final level, restart game flow
    restartGame();
  }
});

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
    // Base values by mode
    if (difficulty === "easy") {
      baseDropSpeed = 2.5;
      basePollutantChance = 0.25;
    } else if (difficulty === "normal") {
      baseDropSpeed = 4;
      basePollutantChance = 0.4;
    } else if (difficulty === "hard") {
      baseDropSpeed = 5.5;
      basePollutantChance = 0.55;
    }
    // Start at Level 1
    level = 1;
    applyLevelScaling();
    setTargetScore();

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
  levelComplete.classList.remove("active");
  player.x = 370;
  player.y = 480; // Always reset y to keep player above the bottom
  shownMilestones.clear();
  updateLives();
  updateScore();
  drops = [];
  for (let i = 0; i < 3; i++) createDrop();
  difficultyDisplay.textContent = `Mode: ${difficulty.toUpperCase()}`;
  startTimer();
  update();
}

function restartGame() {
  pauseMenu.classList.remove("active");
  gameOver.classList.remove("active");
  levelComplete.classList.remove("active");
  level = 1;
  applyLevelScaling();
  setTargetScore();
  gameContainer.classList.add("active");
  startGame();
}
