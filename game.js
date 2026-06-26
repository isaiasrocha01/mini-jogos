const COLORS = ["#ff6b81", "#54a0ff", "#5f27cd", "#ff9f43", "#1dd1a1"]; 

// ========================================================
// LÓGICA DO JOGO 1: PET BUBBLE POP
// ========================================================
let canvas, ctx, scoreEl, nextBubblePreview;
let score = 0, gameOver = false, shotCount = 0;
const SHOTS_TO_DROP = 5, rowsInitial = 5, BUBBLE_RADIUS = 20;
const maxRows = 12, PADDING_X = 40;
let cols, grid = [], activeBullet = null;
const DEADLINE_ROW = 11;
let cannon = { x: 0, y: 0, angle: 0, currentBallColor: "", nextBallColor: "" };

function getRandomColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }
function updatePreview() { if(nextBubblePreview) nextBubblePreview.style.backgroundColor = cannon.nextBallColor; }

function initBubbleGame() {
    canvas = document.getElementById("game");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    scoreEl = document.getElementById("score");
    nextBubblePreview = document.getElementById("next-bubble-preview");

    cols = Math.floor((canvas.width - PADDING_X * 2) / (BUBBLE_RADIUS * 2));
    cannon.x = canvas.width / 2;
    cannon.y = canvas.height - 50;

    cannon.currentBallColor = getRandomColor();
    cannon.nextBallColor = getRandomColor();
    gameOver = false; shotCount = 0; score = 0;
    if(scoreEl) scoreEl.textContent = score; 
    grid = [];
    
    for (let r = 0; r < maxRows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) { grid[r][c] = { x: 0, y: 0, color: null, active: false }; }
    }
    for (let r = 0; r < rowsInitial; r++) {
        for (let c = 0; c < cols; c++) { grid[r][c].active = true; grid[r][c].color = getRandomColor(); }
    }
    recalculateGridPositions();
    updatePreview();
    renderLeaderboard("bubble_records");
    setupBubbleEvents();
    bubbleGameLoop();
}

function recalculateGridPositions() {
    const totalGridWidth = cols * (BUBBLE_RADIUS * 2);
    const startX = (canvas.width - totalGridWidth) / 2 + BUBBLE_RADIUS;
    for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < cols; c++) {
            let xOffset = (r % 2 === 1) ? BUBBLE_RADIUS : 0;
            grid[r][c].x = startX + c * (BUBBLE_RADIUS * 2) + xOffset;
            grid[r][c].y = r * (BUBBLE_RADIUS * 1.732) + BUBBLE_RADIUS + 25;
        }
    }
}

function moveRowsDown() {
    if (gameOver) return;
    for (let r = maxRows - 1; r > 0; r--) {
        for (let c = 0; c < cols; c++) {
            grid[r][c].active = grid[r - 1][c].active;
            grid[r][c].color = grid[r - 1][c].color;
        }
    }
    for (let c = 0; c < cols; c++) { grid[0][c].active = true; grid[0][c].color = getRandomColor(); }
    recalculateGridPositions();
    if (checkGameOverCondition()) triggerGameOver();
}

function checkGameOverCondition() {
    for (let r = DEADLINE_ROW; r < maxRows; r++) {
        for (let c = 0; c < cols; c++) { if (grid[r][c].active) return true; }
    }
    return false;
}

function triggerGameOver() {
    gameOver = true;
    setTimeout(() => {
        let name = prompt(`🐾 Fim de Jogo!\nPontos Totais: ${score}\nNome do Pet:`);
        if (!name || name.trim() === "") name = "Bichinho";
        let records = JSON.parse(localStorage.getItem("bubble_records")) || [];
        records.push({ name: name.substring(0, 12), score: score });
        records.sort((a, b) => b.score - a.score);
        records = records.slice(0, 5);
        localStorage.setItem("bubble_records", JSON.stringify(records));
        renderLeaderboard("bubble_records");
        initBubbleGame();
    }, 200);
}

function renderLeaderboard(keyName) {
    const leaderboardListEl = document.getElementById("leaderboard-list");
    if(!leaderboardListEl) return;
    let records = JSON.parse(localStorage.getItem(keyName)) || [];
    leaderboardListEl.innerHTML = "";
    records.forEach(rec => {
        const li = document.createElement("li");
        li.innerHTML = `🐾 ${rec.name} — <span style="color: #ff7b93">${rec.score}</span>`;
        leaderboardListEl.appendChild(li);
    });
    if(records.length === 0) leaderboardListEl.innerHTML = "<p style='font-size:0.8rem;color:#a0aec0;text-align:center;'>Nenhum pet!</p>";
}

function setupBubbleEvents() {
    if (!canvas) return;
    canvas.removeEventListener("mousemove", handleBubbleMouseMove);
    canvas.addEventListener("mousemove", handleBubbleMouseMove);
    canvas.removeEventListener("contextmenu", handleBubbleContextMenu);
    canvas.addEventListener("contextmenu", handleBubbleContextMenu);
    canvas.removeEventListener("click", handleBubbleClick);
    canvas.addEventListener("click", handleBubbleClick);
    window.removeEventListener("keydown", handleBubbleKeyDown);
    window.addEventListener("keydown", handleBubbleKeyDown);
}

function handleBubbleMouseMove(e) {
    if (gameOver || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;
    cannon.angle = Math.atan2(mouseY - cannon.y, mouseX - cannon.x);
    if (cannon.angle > -0.2) cannon.angle = -0.2;
    if (cannon.angle < -Math.PI + 0.2) cannon.angle = -Math.PI + 0.2;
}

function swapBalls() {
    if (gameOver) return;
    let temp = cannon.currentBallColor;
    cannon.currentBallColor = cannon.nextBallColor;
    cannon.nextBallColor = temp;
    updatePreview();
}

function handleBubbleContextMenu(e) { e.preventDefault(); swapBalls(); }
function handleBubbleKeyDown(e) { if (e.code === "Space") { e.preventDefault(); swapBalls(); } }

function handleBubbleClick(e) {
    if (e.button !== 0 || activeBullet || gameOver) return; 
    activeBullet = { x: cannon.x, y: cannon.y, dx: Math.cos(cannon.angle) * 15, dy: Math.sin(cannon.angle) * 15, color: cannon.currentBallColor };
    shotCount++;
    cannon.currentBallColor = cannon.nextBallColor;
    cannon.nextBallColor = getRandomColor();
    updatePreview();
}

function getNeighbors(r, c) {
    let neighbors = [[r, c-1], [r, c+1], [r-1, c], [r+1, c]];
    if (r % 2 === 1) neighbors.push([r-1, c+1], [r+1, c+1]);
    else neighbors.push([r-1, c-1], [r+1, c-1]);
    return neighbors.filter(([nr, nc]) => nr >= 0 && nr < maxRows && nc >= 0 && nc < cols);
}

function dropDanglingBubbles() {
    let visited = Array(maxRows).fill().map(() => Array(cols).fill(false));
    let queue = [];
    for (let c = 0; c < cols; c++) { if (grid[0][c].active) { queue.push([0, c]); visited[0][c] = true; } }
    while (queue.length > 0) {
        let [r, c] = queue.shift();
        for (let [nr, nc] of getNeighbors(r, c)) {
            if (grid[nr][nc].active && !visited[nr][nc]) { visited[nr][nc] = true; queue.push([nr, nc]); }
        }
    }
    let droppedCount = 0;
    for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c].active && !visited[r][c]) { grid[r][c].active = false; grid[r][c].color = null; score += 15; droppedCount++; }
        }
    }
    if (droppedCount > 0 && scoreEl) scoreEl.textContent = score;
}

function checkAndPopBubble(startRow, startCol, targetColor) {
    let queue = [[startRow, startCol]], matches = [];
    let visited = Array(maxRows).fill().map(() => Array(cols).fill(false));
    while (queue.length > 0) {
        let [r, c] = queue.shift();
        if (visited[r][c] || !grid[r][c].active || grid[r][c].color !== targetColor) continue;
        visited[r][c] = true; matches.push([r, c]);
        for (let [nr, nc] of getNeighbors(r, c)) queue.push([nr, nc]);
    }
    if (matches.length >= 3) { 
        matches.forEach(([r, c]) => { grid[r][c].active = false; grid[r][c].color = null; score += 10; });
        if(scoreEl) scoreEl.textContent = score;
        dropDanglingBubbles();
    }
}

function snapBubbleToGrid(bullet) {
    let closestRow = -1, closestCol = -1, minDist = Infinity;
    for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < cols; c++) {
            let cell = grid[r][c]; if (cell.active) continue;
            let d = Math.hypot(cell.x - bullet.x, cell.y - bullet.y);
            if (d < minDist) { minDist = d; closestRow = r; closestCol = c; }
        }
    }
    if (closestRow !== -1 && closestCol !== -1) {
        grid[closestRow][closestCol].active = true;
        grid[closestRow][closestCol].color = bullet.color;
        if (checkGameOverCondition()) { triggerGameOver(); return; }
        checkAndPopBubble(closestRow, closestCol, bullet.color);
        if (shotCount >= SHOTS_TO_DROP) { shotCount = 0; setTimeout(moveRowsDown, 200); }
    }
}

function updateBubble() {
    if (gameOver || !canvas) return;
    if (activeBullet) {
        activeBullet.x += activeBullet.dx; activeBullet.y += activeBullet.dy;
        if (activeBullet.x - BUBBLE_RADIUS <= 0) { activeBullet.x = BUBBLE_RADIUS; activeBullet.dx *= -1; }
        if (activeBullet.x + BUBBLE_RADIUS >= canvas.width) { activeBullet.x = canvas.width - BUBBLE_RADIUS; activeBullet.dx *= -1; }
        if (activeBullet.y - BUBBLE_RADIUS <= 15) { let b = activeBullet; activeBullet = null; snapBubbleToGrid(b); return; }
        for (let r = 0; r < maxRows; r++) {
            for (let c = 0; c < cols; c++) {
                let bubble = grid[r][c]; if (!bubble.active) continue;
                if (Math.hypot(bubble.x - activeBullet.x, bubble.y - activeBullet.y) < BUBBLE_RADIUS * 1.65) {
                    let b = activeBullet; activeBullet = null; snapBubbleToGrid(b); return;
                }
            }
        }
    }
}

function drawPetBall(x, y, radius, color) {
    ctx.save();
    ctx.shadowBlur = 4; ctx.shadowColor = "rgba(0,0,0,0.1)"; ctx.shadowOffsetY = 2;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius - 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath(); ctx.arc(x, y + 2, radius * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 6, y - 5, radius * 0.15, 0, Math.PI * 2); ctx.arc(x, y - 8, radius * 0.15, 0, Math.PI * 2); ctx.arc(x + 6, y - 5, radius * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawBubbleGame() {
    if (!canvas) return;
    ctx.fillStyle = "#f0f4f8"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#ff7b93"; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    let deadlineY = DEADLINE_ROW * (BUBBLE_RADIUS * 1.5) + (BUBBLE_RADIUS * 1) + 10;
    ctx.beginPath(); ctx.moveTo(10, deadlineY); ctx.lineTo(canvas.width - 10, deadlineY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#ff7b93"; ctx.font = "bold 11px Arial"; ctx.fillText("⚠️ CUIDADO COM O LIMITE!", 85, deadlineY - 8);

    for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < cols; c++) {
            let b = grid[r][c]; if (b.active) drawPetBall(b.x, b.y, BUBBLE_RADIUS, b.color);
        }
    }
    if (!activeBullet && !gameOver) {
        ctx.save(); ctx.strokeStyle = "#cbd5e0"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(cannon.x, cannon.y); ctx.lineTo(cannon.x + Math.cos(cannon.angle) * 200, cannon.y + Math.sin(cannon.angle) * 200);
        ctx.stroke(); ctx.restore();
    }
    if (activeBullet) drawPetBall(activeBullet.x, activeBullet.y, BUBBLE_RADIUS, activeBullet.color);
    
    ctx.save(); ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#cbd5e0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cannon.x - 85, cannon.y + 15, BUBBLE_RADIUS + 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    drawPetBall(cannon.x - 85, cannon.y + 15, BUBBLE_RADIUS - 2, cannon.nextBallColor);

    ctx.fillStyle = "#718096"; ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
    ctx.fillText(`Próxima Descida: ${SHOTS_TO_DROP - shotCount}`, cannon.x - 85, cannon.y - 15); 

    ctx.save(); ctx.translate(cannon.x, cannon.y); ctx.rotate(cannon.angle); ctx.fillStyle = "#ff9f43"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(0, -14, 50, 28, 8); ctx.fill(); ctx.stroke(); ctx.restore();

    if (!gameOver) drawPetBall(cannon.x, cannon.y, BUBBLE_RADIUS, cannon.currentBallColor);
}

function bubbleGameLoop() {
    if(document.getElementById("game")) {
        updateBubble();
        drawBubbleGame();
        requestAnimationFrame(bubbleGameLoop);
    }
}


