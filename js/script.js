const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 540;
canvas.height = 470;
canvas.style.display = "none";

let ballRadius = 13;
let x = canvas.width / 2;
let y = canvas.height - 60;
let dx = 1.2;
let dy = -1.2;

const paddleHeight = 10;
let basePaddleWidth = 100;
let paddleWidth = basePaddleWidth;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight;

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let isPaused = false;

let isDragging = false;
let dragOffsetX = 0;

const brickRowCount = 2;
const brickColumnCount = 7;
const brickWidth = 60;
const brickHeight = 80;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let score = 0;
let gameOver = false;
let animationId;

let comboHits = 0;
let bonusActive = false;
let bonusColorIndex = 0;
let bonusColorTimer = 0;
const bonusColors = ["purple", "red", "orange", "blue"];
let paddleColor = "black";
let bonusTime = 0;

let lastHits = [];

const brickImage = new Image();
brickImage.src = 'slike/card.jpg';

const ballImage = new Image();
ballImage.src = 'slike/ball.png';

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
canvas.addEventListener("mousedown", mouseDownHandler);
canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mousemove", mouseMoveHandler);

function keyDownHandler(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowright" || key === "d") rightPressed = true;
    else if (key === "arrowleft" || key === "a") leftPressed = true;
    else if (key === "w") upPressed = true;
    else if (key === "s") downPressed = true;
    else if (key === "p") {
        isPaused = !isPaused;
        if (!isPaused) requestAnimationFrame(draw);
    }
}

function keyUpHandler(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowright" || key === "d") rightPressed = false;
    else if (key === "arrowleft" || key === "a") leftPressed = false;
    else if (key === "w") upPressed = false;
    else if (key === "s") downPressed = false;
}

function mouseDownHandler(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (
        mouseX > paddleX && mouseX < paddleX + paddleWidth &&
        mouseY > paddleY && mouseY < paddleY + paddleHeight
    ) {
        isDragging = true;
        dragOffsetX = mouseX - paddleX;
    }
}

function mouseMoveHandler(e) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        paddleX = mouseX - dragOffsetX;
        if (paddleX < 0) paddleX = 0;
        if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
    }
}

function drawBall() {
    ctx.drawImage(ballImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
}

function drawPaddle() {
    ctx.fillStyle = paddleColor;
    ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);
            }
        }
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 8, 20);

    if (bonusActive) {
        ctx.fillText("Bonus Time: " + Math.ceil(bonusTime / 60), canvas.width - 140, 20);
    }
}

function collisionDetection() {
    let hit = false;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    b.status = 0;
                    score++;
                    comboHits++;
                    hit = true;

                    const now = Date.now();
                    lastHits.push(now);
                    lastHits = lastHits.filter(t => now - t <= 6000);

                    if (lastHits.length >= 5 && !bonusActive) {
                        bonusActive = true;
                        bonusTime = 20 * 60;
                        paddleWidth = basePaddleWidth + 40;
                        bonusColorTimer = 0;
                    }

                    const hitPointX = x - (b.x + brickWidth / 2);
                    dx += hitPointX * 0.01;
                    dy = -dy;

                    limitBallSpeed();
                }
            }
        }
    }

    let bricksLeft = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) bricksLeft++;
        }
    }

    if (bricksLeft === 0 && !gameOver) {
        gameOver = true;
        cancelAnimationFrame(animationId);
        Swal.fire({
            title: "YOU WIN!",
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Play again",
            cancelButtonText: "Back to Menu"
        }).then((result) => {
            if (result.isConfirmed) {
                resetGame();
                requestAnimationFrame(draw);
            } else {
                resetGame();
                canvas.style.display = "none";
                menuOverlay.style.display = "flex";
                menuOverlay.style.opacity = 1;
            }
        });
    }
}

function limitBallSpeed() {
    const maxSpeed = 2.5;
    const minSpeed = 1.0;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        dx *= scale;
        dy *= scale;
    } else if (speed < minSpeed) {
        const scale = minSpeed / speed;
        dx *= scale;
        dy *= scale;
    }
}

function resetGame() {
    x = canvas.width / 2;
    y = canvas.height - 60;
    dx = 1.2;
    dy = -1.2;
    paddleWidth = basePaddleWidth;
    paddleX = (canvas.width - paddleWidth) / 2;
    paddleY = canvas.height - paddleHeight;
    score = 0;
    comboHits = 0;
    bonusActive = false;
    bonusTime = 0;
    bonusColorIndex = 0;
    bonusColorTimer = 0;
    paddleColor = "black";
    gameOver = false;
    lastHits = [];

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
}

function handlePaddleCollision() {
    if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            const relativeHit = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            dx = relativeHit * 2.2;
            dy = -Math.abs(dy);
            comboHits = 0;
        } else if (y + ballRadius >= canvas.height) {
            gameOver = true;
            cancelAnimationFrame(animationId);
            Swal.fire({
                title: "Game Over",
                icon: "error",
                showCancelButton: true,
                confirmButtonText: "Try again",
                cancelButtonText: "Back to Menu"
            }).then((result) => {
                if (result.isConfirmed) {
                    resetGame();
                    requestAnimationFrame(draw);
                } else {
                    resetGame();
                    canvas.style.display = "none";
                    menuOverlay.style.display = "flex";
                    menuOverlay.style.opacity = 1;
                }
            });
        }
    }
}

const playButton = document.getElementById("playButton");
const infoButton = document.getElementById("infoButton");
const menuOverlay = document.getElementById("menuOverlay");

playButton.addEventListener("click", () => {
    resetGame();
    menuOverlay.style.opacity = 0;
    canvas.style.display = "block";
    setTimeout(() => {
        menuOverlay.style.display = "none";
        requestAnimationFrame(draw);
    }, 500);
});

infoButton.addEventListener("click", () => {
    Swal.fire({
        title: "Navodila",
        html: `Uporabi puščični tipki ali tipke W/A/S/D ali ← ↑ → ↓ za premikanje loparja.
               Premikaš ga lahko tudi z miško, če klikneš in držiš lopar.
               Cilj: razbij vse bricke. Če žogica pade mimo loparja, izgubiš.<br><br>
               Bonus: Če uničiš 5 brickov v 6 sekundah, se lopar poveča za 20 sekund.`,
        icon: "info",
        confirmButtonText: "V redu"
    });
});

function draw() {
    if (gameOver || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    collisionDetection();
    handlePaddleCollision();

    if (x + dx < ballRadius || x + dx > canvas.width - ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 4;
    if (leftPressed && paddleX > 0) paddleX -= 4;
    if (upPressed && paddleY > 0) paddleY -= 2;
    if (downPressed && paddleY < canvas.height - paddleHeight) paddleY += 2;

    x += dx;
    y += dy;

    if (bonusActive) {
        bonusColorTimer++;
        if (bonusColorTimer >= 120) {
            bonusColorIndex = (bonusColorIndex + 1) % bonusColors.length;
            paddleColor = bonusColors[bonusColorIndex];
            bonusColorTimer = 0;
        }

        if (bonusTime > 0) {
            bonusTime--;
        } else {
            bonusActive = false;
            paddleWidth = basePaddleWidth;
            paddleColor = "black";
        }
    }

    animationId = requestAnimationFrame(draw);
}
