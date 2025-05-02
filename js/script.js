const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playButton");
const menuOverlay = document.getElementById("menuOverlay");
const scoreButton = document.getElementById("scoreButton");
const infoButton = document.getElementById("infoButton");

// Optimizacija za vse brskalnike
canvas.style.transform = 'translateZ(0)';
canvas.style.imageRendering = 'pixelated';

canvas.width = 540;
canvas.height = 470;
canvas.style.display = "none";

// Inicializacija igre
let ballRadius = 13;
let x = canvas.width / 2;
let y = canvas.height - 60;
let dx = 3.5;
let dy = -3.5;


const paddleHeight = 10;
let basePaddleWidth = 100;
let paddleWidth = basePaddleWidth;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight;

let rightPressed = false;
let leftPressed = false;
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
let lastTime = 0;
const targetFPS = 60;
const frameDelay = 1000 / targetFPS;

let comboHits = 0;
let bonusActive = false;
let bonusColorIndex = 0;
let bonusColorTimer = 0;
const bonusColors = ["purple", "red", "orange", "blue"];
let paddleColor = "black";
let bonusTime = 0;

let lastHits = [];
let currentPlayerName = "";

// Prednalaganje slik
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

// Event listeners
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
canvas.addEventListener("mousedown", mouseDownHandler);
canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mousemove", mouseMoveHandler);

function keyDownHandler(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowright" || key === "d") rightPressed = true;
    else if (key === "arrowleft" || key === "a") leftPressed = true;
    else if (key === "p") {
        isPaused = !isPaused;
        if (!isPaused) {
            lastTime = performance.now();
            requestAnimationFrame(draw);
        }
    }
}

function keyUpHandler(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowright" || key === "d") rightPressed = false;
    else if (key === "arrowleft" || key === "a") leftPressed = false;
}

function mouseDownHandler(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX > paddleX && mouseX < paddleX + paddleWidth &&
        mouseY > paddleY && mouseY < paddleY + paddleHeight) {
        isDragging = true;
        dragOffsetX = mouseX - paddleX;
    }
}

function mouseMoveHandler(e) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        paddleX = mouseX - dragOffsetX;
        paddleX = Math.max(0, Math.min(paddleX, canvas.width - paddleWidth));
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
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
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

function saveScore(score, playerName) {
    let highscores = JSON.parse(localStorage.getItem("highscores")) || [];
    highscores.push({ 
        name: playerName || "Neimenovan", 
        score: score, 
        time: new Date().toISOString() 
    });
    highscores.sort((a, b) => b.score - a.score);
    localStorage.setItem("highscores", JSON.stringify(highscores));
}

scoreButton.addEventListener("click", showLeaderboard);

function showLeaderboard() {
    let highscores = JSON.parse(localStorage.getItem("highscores")) || [];
    if (highscores.length === 0) {
        Swal.fire("Lestvica", "Ni shranjenih rezultatov.", "info");
        return;
    }

    const tableRows = highscores.map((entry, i) => {
        const timeAgo = ((new Date() - new Date(entry.time)) / 1000).toFixed(1);
        return `
            <tr>
                <td>${i + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${timeAgo} s</td>
            </tr>
        `;
    }).join("");

    Swal.fire({
        title: "Lestvica rezultatov",
        html: `
            <p style="margin-bottom: 10px; font-size: 12px;">Najboljši rezultati vseh igralcev.</p>
            <table style="width:100%; border-collapse: collapse;">
                <thead style="border-bottom: 1px solid #ccc;">
                    <tr>
                        <th>#</th>
                        <th>Ime</th>
                        <th>Točke</th>
                        <th>Pred</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `,
        width: 600,
        confirmButtonText: "Zapri"
    });
}

infoButton.addEventListener("click", showInstructions);

function showInstructions() {
    Swal.fire({
        title: 'Navodila za igranje',
        html: `
            <div style="text-align: left;">
                <h3 style="color: #5d1b94;">Osnovne kontrole:</h3>
                <ul>
                    <li><b>Leva puščica</b> ali <b>A</b> - premik palice levo</li>
                    <li><b>Desna puščica</b> ali <b>D</b> - premik palice desno</li>
                    <li><b>Miška</b> - klik in povlecite palico</li>
                    <li><b>P</b> - pavza</li>
                </ul>
                <h3 style="color: #5d1b94; margin-top: 20px;">Cilj igre:</h3>
                <p>Uniči vse opeke na vrhu zaslona tako, da odbijaš žogico s palico.</p>
                <h3 style="color: #5d1b94; margin-top: 20px;">Bonus sistem:</h3>
                <ul>
                    <li>Ko uničiš 5 opek v 6 sekundah, aktiviraš bonus!</li>
                    <li>Bonus poveča palico in jo obarva v različne barve</li>
                    <li>Bonus traja 20 sekund</li>
                </ul>
                <h3 style="color: #5d1b94; margin-top: 20px;">Točkovanje:</h3>
                <p>Vsaka uničena opeka ti prinese 1 točko.</p>
            </div>
        `,
        width: 600,
        confirmButtonText: "Razumem",
        confirmButtonColor: "#5d1b94",
        background: "rgba(255, 255, 255, 0.9)",
        backdrop: `
            rgba(93,27,148,0.4)
            url("https://media2.giphy.com/media/lEvAambCBZzoY/giphy.gif") 
            center top/350px auto
            no-repeat
        `,
        showClass: {
            backdrop: 'swal2-noanimation'
        }
    });
}

playButton.addEventListener("click", startGame);

function startGame() {
    Swal.fire({
        title: 'Vnesi svoje ime',
        input: 'text',
        inputLabel: 'Ime igralca',
        inputPlaceholder: 'npr. DarkMagician123',
        inputValidator: (value) => {
            if (!value || value.trim() === "") return 'Ime je obvezno!';
            if (value.length > 20) return 'Ime naj bo krajše od 20 znakov!';
            return null;
        },
        showCancelButton: true,
        confirmButtonText: "Začni igro",
        cancelButtonText: "Prekliči"
    }).then((result) => {
        if (result.isConfirmed) {
            currentPlayerName = result.value.trim();
            resetGame();
            menuOverlay.style.opacity = 0;
            canvas.style.display = "block";
            setTimeout(() => {
                menuOverlay.style.display = "none";
                lastTime = performance.now();
                requestAnimationFrame(draw);
            }, 500);
        }
    });
}

function handlePaddleCollision() {
    if (y + dy > canvas.height - ballRadius - paddleHeight) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            const relativeHit = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            dx = relativeHit * 2.2;
            dy = -Math.abs(dy);
            comboHits = 0;
            limitBallSpeed();
        } else if (y + ballRadius >= canvas.height) {
            endGame(false);
        }
    }
}

function limitBallSpeed() {
    const maxSpeed = 7;
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed > maxSpeed) {
        dx = (dx / speed) * maxSpeed;
        dy = (dy / speed) * maxSpeed;
    }
}

function collisionDetection() {
    let hit = false;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x + ballRadius > b.x && x - ballRadius < b.x + brickWidth &&
                    y + ballRadius > b.y && y - ballRadius < b.y + brickHeight) {
                    
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

                    const ballLeft = x - ballRadius;
                    const ballRight = x + ballRadius;
                    const ballTop = y - ballRadius;
                    const ballBottom = y + ballRadius;

                    const brickLeft = b.x;
                    const brickRight = b.x + brickWidth;
                    const brickTop = b.y;
                    const brickBottom = b.y + brickHeight;

                    const overlapLeft = ballRight - brickLeft;
                    const overlapRight = brickRight - ballLeft;
                    const overlapTop = ballBottom - brickTop;
                    const overlapBottom = brickBottom - ballTop;

                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        dx = -dx;
                    } else {
                        dy = -dy;
                    }

                    limitBallSpeed();
                }
            }
        }
    }

    if (bricks.every(col => col.every(brick => brick.status === 0))) {
        endGame(true);
    }
}

function endGame(isWin) {
    gameOver = true;
    cancelAnimationFrame(animationId);
    saveScore(score, currentPlayerName);
    
    Swal.fire({
        title: isWin ? "YOU WIN!" : "Game Over",
        icon: isWin ? "success" : "error",
        showCancelButton: true,
        confirmButtonText: isWin ? "Play again" : "Try again",
        cancelButtonText: "Back to Menu"
    }).then((result) => {
        if (result.isConfirmed) {
            resetGame();
            lastTime = performance.now();
            requestAnimationFrame(draw);
        } else {
            resetGame();
            canvas.style.display = "none";
            menuOverlay.style.display = "flex";
            menuOverlay.style.opacity = 1;
        }
    });
}

function resetGame() {
    x = canvas.width / 2;
    y = canvas.height - 60;
    dx = 3.5;
    dy = -3.5;
    paddleX = (canvas.width - paddleWidth) / 2;
    score = 0;
    gameOver = false;
    comboHits = 0;
    bonusActive = false;
    paddleWidth = basePaddleWidth;
    paddleColor = "black";
    lastHits = [];

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
}

function draw(timestamp) {
    if (isPaused || gameOver) return;
    
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    
    if (deltaTime >= frameDelay) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        collisionDetection();
        handlePaddleCollision();

        // Premik žogice s časovno prilagoditvijo
        x += dx * (deltaTime / frameDelay);
        y += dy * (deltaTime / frameDelay);

        // Odboji od robov
        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
            dx = -dx;
        }
        if (y + dy < ballRadius) {
            dy = -dy;
        }

        // Premikanje palice
        if (rightPressed) paddleX += 5 * (deltaTime / frameDelay);
        else if (leftPressed) paddleX -= 5 * (deltaTime / frameDelay);

        paddleX = Math.max(0, Math.min(paddleX, canvas.width - paddleWidth));

        // Bonus sistem
        if (bonusActive) {
            bonusTime -= deltaTime / frameDelay;
            bonusColorTimer++;
            if (bonusTime <= 0) {
                bonusActive = false;
                paddleWidth = basePaddleWidth;
                paddleColor = "black";
            } else if (bonusColorTimer % 15 === 0) {
                bonusColorIndex = (bonusColorIndex + 1) % bonusColors.length;
                paddleColor = bonusColors[bonusColorIndex];
            }
        }

        lastTime = timestamp;
    }

    animationId = requestAnimationFrame(draw);
}