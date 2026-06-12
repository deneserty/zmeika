const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

// --- Элементы меню ---
const startMenu = document.getElementById('start-menu');
const startGameButton = document.getElementById('start-game-button');
const gameWrapper = document.getElementById('game-wrapper');

// --- Элементы управления ---
const snakeSpeedInput = document.getElementById('snake-speed');
const snakeSpeedValueSpan = document.getElementById('snake-speed-value');
const snakeColorInput = document.getElementById('snake-color');
const foodColorInput = document.getElementById('food-color');
const fieldSizeInput = document.getElementById('field-size');
const themeSelect = document.getElementById('theme-select');

// --- Кнопки управления игрой ---
const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');

// --- Экраны ---
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-button');

// --- Параметры игры ---
let gridSize = 20;
let canvasSize = 400;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let changingDirection = false;

// --- Пользовательские настройки ---
let snakeSpeed = 150;
let snakeColor = '#8FBC8F';
let foodColor = '#FF6347';
let currentFieldSize = 25;

// --- Состояние игры ---
let gameInterval = null;
let isPaused = false;

// --- Препятствия ---
let obstacles = [];
const numberOfObstacles = 5;
let obstacleColor = '#A9A9A9';

// --- Тема ---
let currentTheme = 'classic';
const themes = {
    classic: {
        bodyBg: '#f0f0f0', containerBg: '#fff', canvasBg: '#e9e9e9', canvasBorder: '#ccc',
        scoreColor: '#555', gameOverBg: '#fff', gameOverHeaderColor: '#f44336',
        finalScoreColor: '#4CAF50', labelColor: '#555',
        snakeDefaultColor: '#8FBC8F', foodDefaultColor: '#FF6347', obstacleColor: '#A9A9A9'
    },
    space: {
        bodyBg: '#000033', containerBg: '#111', canvasBg: '#222', canvasBorder: '#666',
        scoreColor: '#00bcd4', gameOverBg: '#333', gameOverHeaderColor: '#ffeb3b',
        finalScoreColor: '#8bc34a', labelColor: '#ccc',
        snakeDefaultColor: '#ADD8E6', foodDefaultColor: '#FF4500', obstacleColor: '#4682B4'
    },
    forest: {
        bodyBg: '#8fbc8f', containerBg: '#d2b48c', canvasBg: '#668b22', canvasBorder: '#3d6604',
        scoreColor: '#deb887', gameOverBg: '#a0522d', gameOverHeaderColor: '#ffdaa4',
        finalScoreColor: '#b8860b', labelColor: '#556b2f',
        snakeDefaultColor: '#32CD32', foodDefaultColor: '#DAA520', obstacleColor: '#556b2f'
    }
};

// --- Функция применения темы ---
function applyTheme(themeName) {
    currentTheme = themeName;
    const theme = themes[themeName];

    document.body.style.backgroundColor = theme.bodyBg;
    // Удаляем все классы тем, кроме текущей
    document.body.classList.forEach(className => {
        if (className.startsWith('theme-')) {
            document.body.classList.remove(className);
        }
    });
    document.body.classList.add(`theme-${themeName}`); // Добавляем текущий класс темы

    document.getElementById('game-container').style.borderColor = theme.containerBorder;
    document.getElementById('game-container').style.backgroundColor = theme.containerBg;
    canvas.style.backgroundColor = theme.canvasBg;
    canvas.style.borderColor = theme.canvasBorder;
    scoreDisplay.style.color = theme.scoreColor;
    gameOverScreen.style.backgroundColor = theme.gameOverBg;
    gameOverScreen.querySelector('.game-over-content').style.backgroundColor = theme.gameOverBg;
    gameOverScreen.querySelector('.game-over-content h2').style.color = theme.gameOverHeaderColor;
    finalScoreDisplay.style.color = theme.finalScoreColor;
    document.querySelectorAll('.control-group label').forEach(label => {
        label.style.color = theme.labelColor;
    });

    obstacleColor = theme.obstacleColor;

    // Обновляем значения по умолчанию для color input'ов
    snakeColorInput.value = theme.snakeDefaultColor;
    foodColorInput.value = theme.foodDefaultColor;
    snakeColor = theme.snakeDefaultColor;
    foodColor = theme.foodDefaultColor;

    // Применением темы не должно влиять на отрисовку, если игра активна
    // Но если игра на паузе или Game Over, можно перерисовать
    if (isPaused || gameOverScreen.classList.contains('visible')) {
        drawSnake();
        drawFood();
        drawObstacles();
    }
}

// --- Функция для отображения игрового контента и скрытия меню ---
function startGame() {
    startMenu.style.visibility = 'hidden'; // Скрываем меню
    startMenu.style.opacity = '0';
    gameWrapper.classList.add('visible'); // Показываем игровой контент

    // Применяем тему, выбранную в меню
    applyTheme(themeSelect.value);

    initializeGameDimensions();
    generateObstacles();
    generateFood();
    mainGameLoop();
}

// --- Инициализация размеров Canvas и Grid ---
function initializeGameDimensions() {
    canvas.width = currentFieldSize * gridSize;
    canvas.height = currentFieldSize * gridSize;

    snake = [{ x: Math.floor(currentFieldSize / 2), y: Math.floor(currentFieldSize / 2) }];
    dx = 0; dy = 0;
    score = 0;
    scoreDisplay.textContent = `Очки: ${score}`;
    changingDirection = false;
    isPaused = false;
    pauseButton.textContent = 'Пауза';
    gameOverScreen.classList.remove('visible');
}

// --- Функция генерации препятствий ---
function generateObstacles() {
    obstacles = [];
    for (let i = 0; i < numberOfObstacles; i++) {
        let newObstacle;
        let collision = true;
        while (collision) {
            newObstacle = {
                x: Math.floor(Math.random() * currentFieldSize),
                y: Math.floor(Math.random() * currentFieldSize)
            };

            collision = false;
            if (newObstacle.x === snake[0].x && newObstacle.y === snake[0].y) collision = true;
            if (!collision && newObstacle.x === food.x && newObstacle.y === food.y) collision = true;
            if (!collision) {
                for (let j = 0; j < obstacles.length; j++) {
                    if (obstacles[j].x === newObstacle.x && obstacles[j].y === newObstacle.y) {
                        collision = true;
                        break;
                    }
                }
            }
        }
        obstacles.push(newObstacle);
    }
}

// --- Основная функция игры (игровой цикл) ---
function mainGameLoop() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }

    gameInterval = setInterval(() => {
        if (!isPaused) {
            changingDirection = false;
            clearCanvas();
            drawObstacles();
            drawFood();
            moveSnake();
            drawSnake();

            if (checkCollision()) {
                gameOver();
            }
        }
    }, snakeSpeed);
}

// --- Функции отрисовки ---
function clearCanvas() {
    ctx.fillStyle = themes[currentTheme].canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = themes[currentTheme].canvasBorder;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawObstacles() {
    ctx.fillStyle = obstacleColor;
    ctx.strokeStyle = 'darkgray';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize, gridSize);
        ctx.strokeRect(obs.x * gridSize, obs.y * gridSize, gridSize, gridSize);
    });
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

// --- Логика движения ---
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    const ateFood = snake[0].x === food.x && snake[0].y === food.y;
    if (ateFood) {
        score += 10;
        scoreDisplay.textContent = `Очки: ${score}`;
        generateFood();
        const originalSnakeColor = snakeColor;
        snakeColor = '#FFFFFF';
        setTimeout(() => {
            snakeColor = originalSnakeColor;
            if (!isPaused && !gameOverScreen.classList.contains('visible')) {
                drawSnake();
            }
        }, 50);
    } else {
        snake.pop();
    }
}

// --- Генерация еды ---
function generateFood() {
    while (true) {
        food.x = Math.floor(Math.random() * currentFieldSize);
        food.y = Math.floor(Math.random() * currentFieldSize);

        let collision = false;
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === food.x && snake[i].y === food.y) {
                collision = true;
                break;
            }
        }
        if (!collision) {
            for (let i = 0; i < obstacles.length; i++) {
                if (obstacles[i].x === food.x && obstacles[i].y === food.y) {
                    collision = true;
                    break;
                }
            }
        }
        if (!collision) {
            break;
        }
    }
}

// --- Обработка ввода пользователя (направление) ---
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

// --- Проверка столкновений ---
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

    for (let i = 0; i < obstacles.length; i++) {
        if (snake[0].x === obstacles[i].x && snake[0].y === obstacles[i].y) {
            return true;
        }
    }

    return false;
}

// --- Функция окончания игры ---
function gameOver() {
    clearInterval(gameInterval);
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.add('visible');
}

// --- Функция перезапуска игры ---
function restartGame() {
    initializeGameDimensions();
    generateObstacles();
    generateFood();
    mainGameLoop();
}

// --- Обработчики событий для настроек ---
snakeSpeedInput.addEventListener('input', () => {
    snakeSpeed = parseInt(snakeSpeedInput.value);
    snakeSpeedValueSpan.textContent = `${snakeSpeed} мс`;
    mainGameLoop();
});

snakeColorInput.addEventListener('input', () => {
    snakeColor = snakeColorInput.value;
    if (isPaused || gameOverScreen.classList.contains('visible')) drawSnake();
});

foodColorInput.addEventListener('input', () => {
    foodColor = foodColorInput.value;
    if (isPaused || gameOverScreen.classList.contains('visible')) drawFood();
});

fieldSizeInput.addEventListener('change', () => {
    currentFieldSize = parseInt(fieldSizeInput.value);
    restartGame();
});

themeSelect.addEventListener('change', (event) => {
    applyTheme(event.target.value);
    restartGame(); // Перезапускаем игру, чтобы применить изменения темы
});

// --- Обработчики событий для кнопок управления игрой ---
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameInterval);
        pauseButton.textContent = 'Продолжить';
    } else {
        pauseButton.textContent = 'Пауза';
        mainGameLoop();
    }
});

restartButton.addEventListener('click', () => {
    restartGame();
});

playAgainButton.addEventListener('click', () => {
    restartGame();
});

// --- Настройка начального меню и первого запуска ---
startGameButton.addEventListener('click', () => {
    startGame(); // Запускаем игру при нажатии кнопки
});

// При загрузке страницы, показываем только начальное меню
document.addEventListener('DOMContentLoaded', () => {
    startMenu.style.visibility = 'visible';
    startMenu.style.opacity = '1';
    gameWrapper.classList.remove('visible'); // Убедимся, что игровой контент скрыт
});

document.addEventListener('keydown', changeDirection);