const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');


const snakeSpeedInput = document.getElementById('snake-speed');
const snakeSpeedValueSpan = document.getElementById('snake-speed-value');
const snakeColorInput = document.getElementById('snake-color');
const foodColorInput = document.getElementById('food-color');
const fieldSizeInput = document.getElementById('field-size');

let gridSize = 20;
let canvasSize = 400;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let changingDirection = false;

let snakeSpeed = 150; 
let snakeColor = '#8FBC8F';
let foodColor = '#FF6347';
let currentFieldSize = 25;


function initializeGameDimensions() {
    canvas.width = currentFieldSize * gridSize;
    canvas.height = currentFieldSize * gridSize;
    snake = [{ x: Math.floor(currentFieldSize / 2), y: Math.floor(currentFieldSize / 2) }];
    generateFood();
}

let gameInterval;

function mainGameLoop() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }

    gameInterval = setInterval(() => {
        changingDirection = false;
        clearCanvas();
        drawFood();
        moveSnake();
        drawSnake();

        if (checkCollision()) {
            gameOver();
            return;
        }
    }, snakeSpeed);
}

function clearCanvas() {
    ctx.fillStyle = '#e9e9e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    ctx.fillStyle = snakeColor;
    ctx.strokeStyle = 'darkgreen';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
}

function drawFood() {
    ctx.fillStyle = foodColor;
    ctx.strokeStyle = 'darkred';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    const ateFood = snake[0].x === food.x && snake[0].y === food.y;
    if (ateFood) {
        score += 10;
        scoreDisplay.textContent = `Очки: ${score}`;
        generateFood();
    } else {
        snake.pop();
    }
}

function generateFood() {
    while (true) {
        food.x = Math.floor(Math.random() * currentFieldSize);
        food.y = Math.floor(Math.random() * currentFieldSize);

        let collisionWithSnake = false;
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === food.x && snake[i].y === food.y) {
                collisionWithSnake = true;
                break;
            }
        }
        if (!collisionWithSnake) {
            break;
        }
    }
}

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    if (changingDirection) return;
    changingDirection = true;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingLeft = dx === -1;
    const goingRight = dx === 1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1; dy = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0; dy = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1; dy = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0; dy = 1;
    }
}

function checkCollision() {
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= currentFieldSize;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= currentFieldSize;
    if (hitLeftWall || hitRightWall || hitTopWall || hitBottomWall) {
        return true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            return true;
        }
    }

    return false;
}

function gameOver() {
    alert(`Игра окончена! Ваш счет: ${score}`);
    score = 0;
    scoreDisplay.textContent = `Очки: ${score}`;
    dx = 0;
    dy = 0;
    initializeGameDimensions();
    generateFood();
    mainGameLoop();
}

snakeSpeedInput.addEventListener('input', () => {
    snakeSpeed = parseInt(snakeSpeedInput.value);
    snakeSpeedValueSpan.textContent = `${snakeSpeed} мс`;
    mainGameLoop();
});

snakeColorInput.addEventListener('input', () => {
    snakeColor = snakeColorInput.value; 
    drawSnake();
});

// Обработчик для выбора цвета еды
foodColorInput.addEventListener('input', () => {
    foodColor = foodColorInput.value;
    drawFood();
});

fieldSizeInput.addEventListener('change', () => {
    currentFieldSize = parseInt(fieldSizeInput.value);
    initializeGameDimensions();
    mainGameLoop();
});

document.addEventListener('DOMContentLoaded', () => {
    initializeGameDimensions();
    generateFood();
    mainGameLoop();
});

document.addEventListener('keydown', changeDirection);