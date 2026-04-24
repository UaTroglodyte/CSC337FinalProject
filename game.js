const gameBoard = document.getElementById("gameBoard");
let snake = [{x:10, y:10}];
let food = {x:5, y:5};
let direction = "right"
let score = 0;

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
        food = {
            x: Math.floor(Math.random() *15),
            y: Math.floor(Math.random() *15)
        };
        score++;
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
    });
}

function checkGameOver(){
    const head = snake[0];
    if (head.x < 0 || head.y < 0 || head.x > 25 || head.y > 25){
        clearInterval(gameInterval);
        saveScore()
        alert("Game OVer");
    }
    for(var i = 1; i < snake.length; i++){
        if (snake[i].x === head.x && snake[i].y === head.y){
            clearInterval(gameInterval);
            saveScore()
            alert("Game Over");
        }
    }
}

function keyPress(event){
    switch(event.key){
        case "ArrowUp":
            direction = "up"
            break;
        case "ArrowDown":
            direction = "down"
            break;
        case "ArrowLeft":
            direction = "left"
            break;
        case "ArrowRight":
            direction = "right"
            break;
    }
}
document.addEventListener("keydown",keyPress);
const gameInterval = setInterval(() =>{
    moveSnake();
    checkGameOver();
    updateGameBoard();
},200);