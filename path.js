const PATH_COLORS = ["#ff6b81", "#54a0ff", "#5f27cd", "#ff9f43"]; // 4 Cores para balancear a dificuldade

let canvasPath, ctxPath, levelEl, clicksEl;
const PATH_ROWS = 8;
const PATH_COLS = 8;
let pathBlockSize;
let pathGrid = [];
let pathLevel = 1;
let pathClicks = 0;
let isPathLevelComplete = false;

function initPathGame() {
    canvasPath = document.getElementById("canvas-path");
    if (!canvasPath) return;
    ctxPath = canvasPath.getContext("2d");
    levelEl = document.getElementById("path-level");
    clicksEl = document.getElementById("path-clicks");

    pathBlockSize = canvasPath.width / PATH_COLS;
    isPathLevelComplete = false;

    // Tenta carregar progresso salvo
    const savedPath = localStorage.getItem("path_finder_save_state");
    if (savedPath) {
        try {
            const state = JSON.parse(savedPath);
            pathGrid = state.grid;
            pathLevel = state.level;
            pathClicks = state.clicks;
        } catch(e) {
            startFreshPathGame();
        }
    } else {
        startFreshPathGame();
    }

    updatePathUI();
    canvasPath.removeEventListener("click", handlePathClick);
    canvasPath.addEventListener("click", handlePathClick);

    pathGameLoop();
}

function startFreshPathGame() {
    pathLevel = 1;
    pathClicks = 0;
    generatePathGrid();
}

function generatePathGrid() {
    pathGrid = [];
    isPathLevelComplete = false;

    for (let r = 0; r < PATH_ROWS; r++) {
        pathGrid[r] = [];
        for (let c = 0; c < PATH_COLS; c++) {
            // Define uma cor aleatória do array
            let colorIdx = Math.floor(Math.random() * PATH_COLORS.length);
            
            pathGrid[r][c] = {
                colorIdx: colorIdx,
                isStart: (r === 0 && c === 0),
                isEnd: (r === PATH_ROWS - 1 && c === PATH_COLS - 1)
            };
        }
    }
    
    // Garante que o início e o fim não comecem com a mesma cor para forçar o jogador a clicar
    if (pathGrid[0][0].colorIdx === pathGrid[PATH_ROWS-1][PATH_COLS-1].colorIdx) {
        pathGrid[PATH_ROWS-1][PATH_COLS-1].colorIdx = (pathGrid[PATH_ROWS-1][PATH_COLS-1].colorIdx + 1) % PATH_COLORS.length;
    }

    savePathState();
}

function savePathState() {
    const state = {
        grid: pathGrid,
        level: pathLevel,
        clicks: pathClicks
    };
    localStorage.setItem("path_finder_save_state", JSON.stringify(state));
}

function resetPathGameBtn() {
    if (confirm("Deseja reiniciar este nível ou o jogo inteiro?\n[OK] Para o jogo INTEIRO\n[Cancelar] Para continuar")) {
        localStorage.removeItem("path_finder_save_state");
        startFreshPathGame();
        updatePathUI();
    }
}

function updatePathUI() {
    if (levelEl) levelEl.textContent = pathLevel;
    if (clicksEl) clicksEl.textContent = pathClicks;
}

function handlePathClick(e) {
    if (isPathLevelComplete) return;

    const rect = canvasPath.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    let c = Math.floor(x / pathBlockSize);
    let r = Math.floor(y / pathBlockSize);

    if (r >= 0 && r < PATH_ROWS && c >= 0 && c < PATH_COLS) {
        // Não muda a cor do início e nem do fim de forma direta se preferir, ou muda para ajustar estratégia
        pathGrid[r][c].colorIdx = (pathGrid[r][c].colorIdx + 1) % PATH_COLORS.length;
        pathClicks++;
        updatePathUI();
        
        checkPathConnection();
        savePathState();
    }
}

// Algoritmo de Busca para checar se existe caminho fluido entre (0,0) e (fim, fim)
function checkPathConnection() {
    let targetColorIdx = pathGrid[0][0].colorIdx;
    let queue = [[0, 0]];
    let visited = Array(PATH_ROWS).fill().map(() => Array(PATH_COLS).fill(false));
    visited[0][0] = true;

    let reachedEnd = false;

    while (queue.length > 0) {
        let [currR, currC] = queue.shift();

        if (currR === PATH_ROWS - 1 && currC === PATH_COLS - 1) {
            reachedEnd = true;
            break;
        }

        // Direções: Cima, Baixo, Esquerda, Direita
        let dirs = [[currR - 1, currC], [currR + 1, currC], [currR, currC - 1], [currR, currC + 1]];
        
        for (let [nr, nc] of dirs) {
            if (nr >= 0 && nr < PATH_ROWS && nc >= 0 && nc < PATH_COLS) {
                if (!visited[nr][nc] && pathGrid[nr][nc].colorIdx === targetColorIdx) {
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                }
            }
        }
    }

    if (reachedEnd) {
        isPathLevelComplete = true;
        document.getElementById("path-instructions").textContent = "🎉 Incrível! Você conectou o caminho!";
        
        setTimeout(() => {
            pathLevel++;
            generatePathGrid();
            updatePathUI();
            document.getElementById("path-instructions").textContent = "Clique nos blocos para mudar a cor deles e conectar a Patinha 🐾 ao Osso 🦴!";
        }, 1800);
    }
}

function drawPathGame() {
    if (!canvasPath) return;
    ctxPath.clearRect(0, 0, canvasPath.width, canvasPath.height);

    for (let r = 0; r < PATH_ROWS; r++) {
        for (let c = 0; c < PATH_COLS; c++) {
            let block = pathGrid[r][c];
            
            ctxPath.save();
            ctxPath.fillStyle = PATH_COLORS[block.colorIdx];
            
            // Desenha o bloco com bordas suaves
            ctxPath.beginPath();
            ctxPath.roundRect(c * pathBlockSize + 2, r * pathBlockSize + 2, pathBlockSize - 4, pathBlockSize - 4, 6);
            ctxPath.fill();

            // Detalhes visuais dos cantos especiais (Início e Fim)
            if (block.isStart || block.isEnd) {
                ctxPath.lineWidth = 3;
                ctxPath.strokeStyle = "#ffffff";
                ctxPath.stroke();
            }

            // Renderiza os emojis correspondentes
            ctxPath.font = "1.6rem Arial";
            ctxPath.textAlign = "center";
            ctxPath.textBaseline = "middle";
            
            if (block.isStart) {
                ctxPath.fillText("🐾", c * pathBlockSize + pathBlockSize / 2, r * pathBlockSize + pathBlockSize / 2);
            } else if (block.isEnd) {
                ctxPath.fillText("🦴", c * pathBlockSize + pathBlockSize / 2, r * pathBlockSize + pathBlockSize / 2);
            }
            
            ctxPath.restore();
        }
    }
}

function pathGameLoop() {
    if (document.getElementById("canvas-path")) {
        drawPathGame();
        requestAnimationFrame(pathGameLoop);
    }
}