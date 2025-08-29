const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;

let box = 20;
let snake = [{ x: 9 * box, y: 10 * box }];
let direction;
let food = {
  x: Math.floor(Math.random() * (canvas.width / box)) * box,
  y: Math.floor(Math.random() * (canvas.height / box)) * box,
};
let score = 0;
let gameSpeed = 100; // Starting speed (milliseconds)
let game;

document.addEventListener("keydown", changeDirection);

function changeDirection(event) {
  // Arrow keys
  if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  
  // WASD keys
  else if ((event.key === "a" || event.key === "A") && direction !== "RIGHT") direction = "LEFT";
  else if ((event.key === "w" || event.key === "W") && direction !== "DOWN") direction = "UP";
  else if ((event.key === "d" || event.key === "D") && direction !== "LEFT") direction = "RIGHT";
  else if ((event.key === "s" || event.key === "S") && direction !== "UP") direction = "DOWN";
}

function drawSnakeHead(x, y, dir) {
  // Draw realistic snake head
  ctx.fillStyle = "#2E8B57"; // Forest green color
  ctx.beginPath();
  ctx.ellipse(x + box/2, y + box/2, box/2, box/2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw eyes based on direction
  ctx.fillStyle = "black";
  const eyeSize = box / 6;
  
  switch(dir) {
    case "RIGHT":
      ctx.beginPath();
      ctx.arc(x + box - eyeSize * 1.5, y + box/3, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + box - eyeSize * 1.5, y + 2*box/3, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "LEFT":
      ctx.beginPath();
      ctx.arc(x + eyeSize * 1.5, y + box/3, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + eyeSize * 1.5, y + 2*box/3, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "UP":
      ctx.beginPath();
      ctx.arc(x + box/3, y + eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 2*box/3, y + eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "DOWN":
      ctx.beginPath();
      ctx.arc(x + box/3, y + box - eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 2*box/3, y + box - eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  // Draw tongue if moving
  if (dir === "RIGHT" || dir === "LEFT") {
    ctx.strokeStyle = "#FF6B6B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (dir === "RIGHT") {
      ctx.moveTo(x + box, y + box/2);
      ctx.lineTo(x + box + box/3, y + box/2 - box/6);
      ctx.moveTo(x + box, y + box/2);
      ctx.lineTo(x + box + box/3, y + box/2 + box/6);
    } else {
      ctx.moveTo(x, y + box/2);
      ctx.lineTo(x - box/3, y + box/2 - box/6);
      ctx.moveTo(x, y + box/2);
      ctx.lineTo(x - box/3, y + box/2 + box/6);
    }
    ctx.stroke();
  }
}

function drawSnakeBody(x, y, isTail = false) {
  if (isTail) {
    // Draw realistic snake tail - tapered and pointed
    ctx.fillStyle = "#2E8B57";
    ctx.beginPath();
    
    if (direction === "RIGHT" || direction === "LEFT") {
      // Horizontal tail
      ctx.moveTo(x, y);
      ctx.lineTo(x + box, y + box/2);
      ctx.lineTo(x, y + box);
      ctx.closePath();
    } else {
      // Vertical tail
      ctx.moveTo(x, y);
      ctx.lineTo(x + box/2, y + box);
      ctx.lineTo(x + box, y);
      ctx.closePath();
    }
    ctx.fill();
    
  } else {
    // Draw realistic snake body with scales
    ctx.fillStyle = "#2E8B57"; // Main body color
    ctx.beginPath();
    ctx.ellipse(x + box/2, y + box/2, box/2, box/2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add scale pattern
    ctx.fillStyle = "#228B22";
    for (let i = 0; i < 3; i++) {
      const scaleY = y + box/4 + (i * box/4);
      ctx.beginPath();
      ctx.ellipse(x + box/2, scaleY, box/4, box/8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFood(x, y) {
  // Draw apple-like food
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(x + box/2, y + box/2, box/2 - 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw stem
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(x + box/2 - 1, y + 2, 2, 4);
  
  // Draw leaf
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.moveTo(x + box/2 + 2, y + 2);
  ctx.lineTo(x + box/2 + 6, y - 2);
  ctx.lineTo(x + box/2 + 8, y + 1);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw food
  drawFood(food.x, food.y);

  // Draw snake
  for (let i = 0; i < snake.length; i++) {
    if (i === 0) {
      drawSnakeHead(snake[i].x, snake[i].y, direction);
    } else if (i === snake.length - 1) {
      drawSnakeBody(snake[i].x, snake[i].y, true); // Draw tail for last segment
    } else {
      drawSnakeBody(snake[i].x, snake[i].y, false);
    }
  }

  // Old head position
  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  // Direction
  if (direction === "LEFT") snakeX -= box;
  if (direction === "UP") snakeY -= box;
  if (direction === "RIGHT") snakeX += box;
  if (direction === "DOWN") snakeY += box;

  // If snake eats food
  if (snakeX === food.x && snakeY === food.y) {
    score++;
    document.getElementById("score").innerText = "Score: " + score;
    food = {
      x: Math.floor(Math.random() * (canvas.width / box)) * box,
      y: Math.floor(Math.random() * (canvas.height / box)) * box,
    };
    increaseSpeed(); // Increase speed when food is eaten
  } else {
    snake.pop();
  }

  // New head
  let newHead = { x: snakeX, y: snakeY };

  // Game over conditions
  if (
    snakeX < 0 ||
    snakeY < 0 ||
    snakeX >= canvas.width ||
    snakeY >= canvas.height ||
    collision(newHead, snake)
  ) {
    clearInterval(game);
    alert("Game Over! Final Score: " + score + "\n\nClick the Restart button to play again!");
  }

  snake.unshift(newHead);
}

function collision(head, array) {
  for (let i = 0; i < array.length; i++) {
    if (head.x === array[i].x && head.y === array[i].y) {
      return true;
    }
  }
  return false;
}

// Start the game
function startGame() {
  if (game) {
    clearInterval(game);
  }
  game = setInterval(draw, gameSpeed);
}

// Increase speed when food is eaten
function increaseSpeed() {
  // Decrease interval by 5ms for each food eaten, with minimum speed of 50ms
  gameSpeed = Math.max(50, gameSpeed - 5);
  clearInterval(game);
  startGame();
}

// Restart the game
function restartGame() {
  clearInterval(game);
  snake = [{ x: 9 * box, y: 10 * box }];
  direction = undefined;
  food = {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box,
  };
  score = 0;
  gameSpeed = 100;
  document.getElementById("score").innerText = "Score: " + score;
  startGame();
}

// Add event listener for restart button
document.addEventListener("DOMContentLoaded", function() {
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", restartGame);
  }
});

// Initialize and start the game
startGame();
