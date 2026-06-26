/*=====================================================
                PET TETRIS
          Parte 1 - Motor do jogo
======================================================*/

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

I:[
[0,0,0,0],
[1,1,1,1],
[0,0,0,0],
[0,0,0,0]
],

J:[
[2,0,0],
[2,2,2],
[0,0,0]
],

L:[
[0,0,3],
[3,3,3],
[0,0,0]
],

O:[
[4,4],
[4,4]
],

S:[
[0,5,5],
[5,5,0],
[0,0,0]
],

T:[
[0,6,0],
[6,6,6],
[0,0,0]
],

Z:[
[7,7,0],
[0,7,7],
[0,0,0]
]

};

function createBoard(){

    board=[];

    for(let y=0;y<ROWS;y++){

        board.push(new Array(COLS).fill(0));

    }

}

createBoard();

/*=============================
        JOGADOR
=============================*/

const player={

x:0,

y:0,

matrix:null,

next:null

};

/*=============================
      PEÇA ALEATÓRIA
=============================*/

function randomPiece(){

    const pieces="IJLOSTZ";

    const type=pieces[Math.floor(Math.random()*pieces.length)];

    return PIECES[type].map(row=>row.slice());

}

/*=============================
      NOVA PEÇA
=============================*/

function playerReset(){

    if(player.next==null){

        player.matrix=randomPiece();

        player.next=randomPiece();

    }else{

        player.matrix=player.next;

        player.next=randomPiece();

    }

    player.y=0;

    player.x=((COLS/2)|0)-((player.matrix[0].length/2)|0);

    drawNext();

}

/*=============================
     DESENHAR BLOCO
=============================*/

function drawMatrix(matrix,offset){

    matrix.forEach((row,y)=>{

        row.forEach((value,x)=>{

            if(value!==0){

                ctx.fillStyle=COLORS[value];

                ctx.fillRect(
                    x+offset.x,
                    y+offset.y,
                    1,
                    1
                );

                ctx.strokeStyle="#ffffff";

                ctx.lineWidth=0.05;

                ctx.strokeRect(
                    x+offset.x,
                    y+offset.y,
                    1,
                    1
                );

            }

        });

    });

}

/*=============================
      DESENHAR TABULEIRO
=============================*/

function drawBoard(){

    board.forEach((row,y)=>{

        row.forEach((value,x)=>{

            if(value!==0){

                ctx.fillStyle=COLORS[value];

                ctx.fillRect(x,y,1,1);

                ctx.strokeStyle="#fff";

                ctx.lineWidth=0.05;

                ctx.strokeRect(x,y,1,1);

            }

        });

    });

}

/*=============================
        DESENHAR TELA
=============================*/

function draw(){

    ctx.fillStyle="#f8fbff";

    ctx.fillRect(0,0,COLS,ROWS);

    drawBoard();

    drawMatrix(player.matrix,{
        x:player.x,
        y:player.y
    });

}

/*=============================
      PRÓXIMA PEÇA
=============================*/

function drawNext(){

    nextCtx.clearRect(
        0,
        0,
        nextCanvas.width,
        nextCanvas.height
    );

    const size=25;

    player.next.forEach((row,y)=>{

        row.forEach((value,x)=>{

            if(value){

                nextCtx.fillStyle=COLORS[value];

                nextCtx.fillRect(

                    x*size+20,

                    y*size+20,

                    size,

                    size

                );

                nextCtx.strokeStyle="#fff";

                nextCtx.strokeRect(

                    x*size+20,

                    y*size+20,

                    size,

                    size

                );

            }

        });

    });

}

/*=============================
      ATUALIZA HUD
=============================*/

function updateHUD(){

    scoreEl.textContent=score;

    levelEl.textContent=level;

    linesEl.textContent=lines;

}

/*=============================
        INICIAR
=============================*/

playerReset();

updateHUD();

draw();


/*=====================================================
        PET TETRIS
   Parte 2 - Movimento, colisão e controles
======================================================*/

/*=============================
        COLISÃO
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
                    !board[y + p][x + o] ||
                    board[y + p][x + o] !== 0
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

/*=============================
        MESCLAR PEÇA
=============================*/

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
        ROTACIONAR
=============================*/

function rotate(matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [
                matrix[x][y],
                matrix[y][x]
            ] = [
                matrix[y][x],
                matrix[x][y]
            ];
        }
    }
    matrix.forEach(row => row.reverse());
}

/*=============================
      TESTE DE ROTAÇÃO
=============================*/

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
}

/*=============================
        MOVIMENTO
=============================*/

function playerMove(dir) {
    player.x += dir;

    if (collide(board, player)) {
        player.x -= dir;
    }
}

/*=============================
        QUEDA
=============================*/

function playerDrop() {
    player.y++;

    if (collide(board, player)) {
        player.y--;
        merge(board, player);
        playerReset();
        updateHUD();
    }

    dropCounter = 0;
}

/*=============================
        HARD DROP
=============================*/

function playerHardDrop() {
    while (!collide(board, player)) {
        player.y++;
    }
    player.y--;
    merge(board, player);
    playerReset();
    updateHUD();
    dropCounter = 0;
}

/*=============================
        INPUT TECLADO
=============================*/

document.addEventListener("keydown", event => {

    if (event.key === "ArrowLeft") {
        playerMove(-1);
    }

    else if (event.key === "ArrowRight") {
        playerMove(1);
    }

    else if (event.key === "ArrowDown") {
        playerDrop();
    }

    else if (event.key === "ArrowUp") {
        playerRotate();
    }

    else if (event.code === "Space") {
        playerHardDrop();
    }

});

/*=============================
        LOOP DO JOGO
=============================*/

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

update();


/*=====================================================
        PET TETRIS
   Parte 3 - Linhas, pontuação, game over e ranking
======================================================*/

/*=============================
        LIMPAR LINHAS
=============================*/

function arenaSweep() {
    let rowCount = 1;

    outer: for (let y = board.length - 1; y > 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;

        lines += rowCount;
        score += rowCount * 100;

        rowCount *= 2;
    }

    updateLevel();
    updateHUD();
}

/*=============================
        NÍVEL E VELOCIDADE
=============================*/

function updateLevel() {
    level = Math.floor(lines / 10) + 1;

    dropInterval = Math.max(100, 800 - (level - 1) * 70);
}

/*=============================
        GAME OVER
=============================*/

function isGameOver() {
    for (let x = 0; x < board[0].length; x++) {
        if (board[0][x] !== 0) {
            return true;
        }
    }
    return false;
}

/*=============================
        FINALIZAR JOGO
=============================*/

function gameOver() {

    cancelAnimationFrame(animationId);

    let name = prompt(
        "💀 Game Over!\nSua pontuação: " + score + "\nNome do jogador:"
    );

    if (!name) name = "Player";

    let records = JSON.parse(localStorage.getItem("tetris_records")) || [];

    records.push({
        name: name.slice(0, 12),
        score: score
    });

    records.sort((a, b) => b.score - a.score);

    records = records.slice(0, 5);

    localStorage.setItem("tetris_records", JSON.stringify(records));

    renderLeaderboard();

    setTimeout(() => {
        restartGame();
    }, 500);
}

/*=============================
        REINICIAR
=============================*/

function restartGame() {

    board = [];
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 800;

    createBoard();
    playerReset();
    updateHUD();

    update();

}

/*=============================
        CHECAR GAME OVER
=============================*/

function checkGameOver() {
    if (collide(board, player)) {
        if (player.y === 0) {
            gameOver();
        }
    }
}

/*=============================
        ATUALIZAR DROP
=============================*/

const originalPlayerDrop = playerDrop;

playerDrop = function () {

    originalPlayerDrop();

    arenaSweep();

    if (isGameOver()) {
        gameOver();
    }
};

/*=============================
        RANKING
=============================*/

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

/*=============================
        BOTÃO REINICIAR
=============================*/

document.getElementById("restartBtn")?.addEventListener("click", () => {
    restartGame();
});

/*=============================
        INICIALIZAÇÃO FINAL
=============================*/

renderLeaderboard();