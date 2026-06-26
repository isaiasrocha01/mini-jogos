/*=====================================================
                    PET TETRIS
======================================================*/

const SFX = {
    move: new Audio("sounds/move.mp3"),
    rotate: new Audio("sounds/rotate.mp3"),
    line: new Audio("sounds/line.mp3"),
    drop: new Audio("sounds/drop.mp3"),
    over: new Audio("sounds/gameover.mp3")
};

function playSound(s) {
    if (SFX[s]) {
        SFX[s].currentTime = 0;
        SFX[s].play().catch(() => {});
    }
}

const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

ctx.scale(BLOCK, BLOCK);

let board = [];
let score = 0;
let level = 1;
let lines = 0;

let dropInterval = 800;
let lastTime = 0;
let dropCounter = 0;
let animationId = null;

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");

const COLORS = [
    null,
    "#54a0ff",
    "#ff6b81",
    "#1dd1a1",
    "#feca57",
    "#5f27cd",
    "#ff9f43",
    "#48dbfb"
];

/*=============================
            TETRAMINÓS
=============================*/
const PIECES = {
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J:[[2,0,0],[2,2,2],[0,0,0]],
    L:[[0,0,3],[3,3,3],[0,0,0]],
    O:[[4,4],[4,4]],
    S:[[0,5,5],[5,5,0],[0,0,0]],
    T:[[0,6,0],[6,6,6],[0,0,0]],
    Z:[[7,7,0],[0,7,7],[0,0,0]]
};

function createBoard(){
    board = [];
    for(let y = 0; y < ROWS; y++){
        board.push(new Array(COLS).fill(0));
    }
}

/*=============================
            JOGADOR
=============================*/
const player = {
    x: 0,
    y: 0,
    matrix: null,
    next: null
};

function randomPiece(){
    const pieces = "IJLOSTZ";
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    return PIECES[type].map(row => row.slice());
}

function playerReset(){
    if (player.next == null) {
        player.matrix = randomPiece();
        player.next = randomPiece();
    } else {
        player.matrix = player.next;
        player.next = randomPiece();
    }

    player.y = 0;
    player.x = ((COLS / 2) | 0) - ((player.matrix[0].length / 2) | 0);

    // Se ao resetar a peça já colidir, significa que o tabuleiro encheu
    if (collide(board, player)) {
        gameOver();
        return;
    }

    drawNext();
}

/*=============================
        DESENHAR ELEMENTOS
=============================*/
function drawMatrix(matrix, offset){
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0){
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawBoard(){
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0){
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x, y, 1, 1);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x, y, 1, 1);
            }
        });
    });
}

function draw(){
    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(0, 0, COLS, ROWS);
    drawBoard();
    if (player.matrix) {
        drawMatrix(player.matrix, { x: player.x, y: player.y });
    }
}

function drawNext(){
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const size = 25;
    player.next.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value){
                nextCtx.fillStyle = COLORS[value];
                nextCtx.fillRect(x * size + 20, y * size + 20, size, size);
                nextCtx.strokeStyle = "#fff";
                nextCtx.strokeRect(x * size + 20, y * size + 20, size, size);
            }
        });
    });
}

function updateHUD(){
    if (scoreEl) scoreEl.textContent = score;
    if (levelEl) levelEl.textContent = level;
    if (linesEl) linesEl.textContent = lines;
}

/*=============================
      COLISÃO E MOVIMENTOS
=============================*/
function collide(board, player) {
    const m = player.matrix;
    const o = player.x;
    const p = player.y;

    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0) {
                if (
                    !board[y + p] ||
                    board[y + p][x + o] === undefined ||
                    board[y + p][x + o] !== 0
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

function playerMove(dir) {
    player.x += dir;
    if (collide(board, player)) {
        player.x -= dir;
    } else {
        playSound("move");
    }
}

function rotate(matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());
}

function playerRotate() {
    const pos = player.x;
    let offset = 1;
    rotate(player.matrix);

    while (collide(board, player)) {
        player.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));

        if (offset > player.matrix[0].length) {
            rotate(player.matrix);
            rotate(player.matrix);
            rotate(player.matrix);
            player.x = pos;
            return;
        }
    }
    playSound("rotate");
}

function playerDrop() {
    player.y++;
    if (collide(board, player)) {
        player.y--;
        merge(board, player);
        arenaSweep();
        playSound("drop");
        playerReset();
        updateHUD();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(board, player)) {
        player.y++;
    }
    player.y--;
    merge(board, player);
    arenaSweep();
    playSound("drop");
    playerReset();
    updateHUD();
    dropCounter = 0;
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.y][x + player.x] = value;
            }
        });
    });
}

/*=============================
        LOGICA DO JOGO
=============================*/
function arenaSweep() {
    let rowCount = 1;
    let clearedLines = 0;

    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;

        clearedLines += rowCount;
        rowCount *= 2;
    }

    if (clearedLines > 0) {
        lines += clearedLines;
        score += clearedLines * 100;
        playSound("line");
        updateLevel();
    }
}

function updateLevel() {
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 800 - (level - 1) * 70);
}

function gameOver() {
    cancelAnimationFrame(animationId);
    playSound("over");

    // Pequeno timeout para renderizar a última peça antes do prompt congelar a tela
    setTimeout(() => {
        let name = prompt("💀 Game Over!\nSua pontuação: " + score + "\nNome do jogador:");
        if (!name) name = "Player";

        let records = JSON.parse(localStorage.getItem("tetris_records")) || [];
        records.push({ name: name.slice(0, 12), score: score });
        records.sort((a, b) => b.score - a.score);
        records = records.slice(0, 5);
        localStorage.setItem("tetris_records", JSON.stringify(records));

        renderLeaderboard();
        restartGame();
    }, 50);
}

function restartGame() {
    if (animationId) cancelAnimationFrame(animationId);
    board = [];
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 800;
    dropCounter = 0;
    lastTime = 0;

    createBoard();
    playerReset();
    updateHUD();
    update();
}

/*=============================
      CONTROLES & LOOP
=============================*/
document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft")  playerMove(-1);
    if (event.key === "ArrowRight") playerMove(1);
    if (event.key === "ArrowDown")  playerDrop();
    if (event.key === "ArrowUp")    playerRotate();
    if (event.code === "Space")     playerHardDrop();
});

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function renderLeaderboard() {
    const list = document.getElementById("leaderboard-list");
    if (!list) return;

    let records = JSON.parse(localStorage.getItem("tetris_records")) || [];
    list.innerHTML = "";

    records.forEach(r => {
        const li = document.createElement("li");
        li.textContent = `🐾 ${r.name} — ${r.score}`;
        list.appendChild(li);
    });
}

document.getElementById("restartBtn")?.addEventListener("click", () => {
    restartGame();
});

// Inicialização Inicial
createBoard();
playerReset();
updateHUD();
renderLeaderboard();
update();
