const gameBoard = document.getElementById("gameBoard");
const scoreDisplay = document.getElementById("scoreDisplay");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const totalScoreDisplay = document.getElementById("totalScoreDisplay");
const gameMessage = document.getElementById("gameMessage");
let gameInterval;
let snake = [{x:10, y:10}];
let food = generateFood();
let direction = "right"
let score = 0;
let selectedSkin = "greenSnake";

function updateGameBoard(){
    gameBoard.innerHTML = "";
    for(var i = 0; i< snake.length;i++){
        const snakePart = document.createElement("div");
        snakePart.classList.add("snakePart");
        snakePart.style.left = snake[i].x *20 + "px";
        snakePart.style.top = snake[i].y *20 + "px";
        gameBoard.appendChild(snakePart);
    }
    const foodElm = document.createElement("div");
    foodElm.id = "food";
    foodElm.style.left = food.x *20 +"px";
    foodElm.style.top = food.y *20 +"px";
    gameBoard.appendChild(foodElm);
}

function generateFood(){
    let newFood;
    let onSnake;
    do {
        newFood = {
            x: Math.floor(Math.random() *25),
            y: Math.floor(Math.random() *25)
        };
        onSnake = snake.some(part => part.x === newFood.x && part.y === newFood.y)
    } while (onSnake);
    return newFood;
}

function loadUserStats(){
    fetch("/user-stats")
    .then(res => res.json())
    .then(data => {
        highScoreDisplay.innerText = data.highScore;
        totalScoreDisplay.innerText = data.totalScore;
    });
}

function updateScoreDisplay() {
    scoreDisplay.innerText = score;
}

function moveSnake(){
    const newHead = { x:snake[0].x, y: snake[0].y};
    switch(direction){
        case "up":
            newHead.y -= 1;
            break;
        case "down":
            newHead.y +=1;
            break;
        case "left":
            newHead.x -= 1;
            break;
        case "right":
            newHead.x += 1;
            break;
    }
    snake.unshift(newHead);
    if (newHead.x === food.x && newHead.y === food.y){
        score++;
        updateScoreDisplay();
        food = generateFood();
    } else{
        snake.pop();
    }
}

function saveScore() {
    fetch("/save-score", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ score: score })
    })
    .then(res => res.json())
    .then(data => {
        highScoreDisplay.innerText = data.highScore;
        totalScoreDisplay.innerText = data.totalScore;
        gameMessage.innerText = data.message;
    });
}

function checkGameOver(){
    const head = snake[0];
    if (head.x < 0 || head.y < 0 || head.x > 24 || head.y > 24){
        clearInterval(gameInterval);
        gameOver = true;
        saveScore()
        return;
    }
    for(var i = 1; i < snake.length; i++){
        if (snake[i].x === head.x && snake[i].y === head.y){
            clearInterval(gameInterval);
            gameOver = true;
            saveScore()
            return;
        }
    }
}

function keyPress(event){
    if (event.key === "ArrowUp" && direction !== "down") {
        direction = "up";
    } else if (event.key === "ArrowDown" && direction !== "up") {
        direction = "down";
    } else if (event.key === "ArrowLeft" && direction !== "right") {
        direction = "left";
    } else if (event.key === "ArrowRight" && direction !== "left") {
        direction = "right";
    }
}

function restartGame() {
    clearInterval(gameInterval);
    saveScore();
    snake = [{x:10, y:10}];
    food = {x:5, y:5};
    direction = "right";
    score = 0;
    gameOver = false;
    gameMessage.innerText = "";

    updateScoreDisplay();
    updateGameBoard();
    startGame();
}

function goToShop() {
    window.location.href = "/shop";
}

function logout() {
    window.location.href = "/logout";
}

document.addEventListener("keydown",keyPress);
function startGame() {
    gameInterval = setInterval(() => {
        moveSnake();
        checkGameOver();
        updateGameBoard();
    }, 200);
}
loadUserStats();
startGame();
updateScoreDisplay();