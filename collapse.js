const COLORS = ["#ff6b81", "#54a0ff", "#5f27cd", "#ff9f43", "#1dd1a1"]; 

let canvasCol, ctxCol, collapseScoreEl;
const COLLAPSE_ROWS = 10;
const COLLAPSE_COLS = 10;
let blockSize;
let collapseGrid = [];
let collapseScore = 0;
let particles = [];
let flyingTools = [];
let currentRound = 1;
let isResettingRound = false; 

const TOOL_EMOJIS = { bomb: "💣", rocket: "🚀", bee: "🐝", plane: "✈️", ufo: "🛸" };
let selectedTool = null;
let toolCounts = { bomb: 2, rocket: 2, bee: 2, plane: 2, ufo: 1 };

function initCollapseGame() {
    canvasCol = document.getElementById("canvas-collapse");
    if (!canvasCol) return;
    ctxCol = canvasCol.getContext("2d");
    collapseScoreEl = document.getElementById("collapse-score");

    blockSize = canvasCol.width / COLLAPSE_COLS;
    isResettingRound = false;

    // Tenta carregar o estado salvo no navegador
    const savedState = localStorage.getItem("collapse_save_state");
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            collapseGrid = state.grid;
            collapseScore = state.score;
            currentRound = state.round;
            toolCounts = state.tools;
        } catch(e) {
            startFreshGame();
        }
    } else {
        startFreshGame();
    }

    if(collapseScoreEl) collapseScoreEl.textContent = collapseScore;
    updateToolButtonsHTML();

    canvasCol.removeEventListener("click", handleCollapseClick);
    canvasCol.addEventListener("click", handleCollapseClick);
    
    window.removeEventListener("mousemove", updateCustomCursorPos);
    window.addEventListener("mousemove", updateCustomCursorPos);

    renderLeaderboard("collapse_records");
    collapseGameLoop();
}

function startFreshGame() {
    collapseScore = 0;
    currentRound = 1;
    toolCounts = { bomb: 2, rocket: 2, bee: 2, plane: 2, ufo: 1 };
    generateNewRoundGrid();
}

function saveGameState() {
    const state = {
        grid: collapseGrid,
        score: collapseScore,
        round: currentRound,
        tools: toolCounts
    };
    localStorage.setItem("collapse_save_state", JSON.stringify(state));
}

function resetCurrentGameBtn() {
    if(confirm("Deseja mesmo reiniciar a partida do zero?")) {
        localStorage.removeItem("collapse_save_state");
        startFreshGame();
        if(collapseScoreEl) collapseScoreEl.textContent = collapseScore;
        showFeedbackText("🔄 Jogo reiniciado do zero!");
    }
}

function generateNewRoundGrid() {
    collapseGrid = [];
    particles = [];
    flyingTools = [];
    selectedTool = null;
    isResettingRound = false;
    hideCustomCursor();
    updateToolButtonsHTML();

    for(let r=0; r < COLLAPSE_ROWS; r++) {
        collapseGrid[r] = [];
        for(let c=0; c < COLLAPSE_COLS; c++) {
            let visualY = r * blockSize;
            let toolInside = null;
            if(Math.random() < 0.08) {
                const toolsList = ["bomb", "rocket", "bee", "plane", "ufo"];
                toolInside = toolsList[Math.floor(Math.random() * toolsList.length)];
            }

            collapseGrid[r][c] = { 
                color: COLORS[Math.floor(Math.random() * COLORS.length)], 
                active: true,
                currentY: visualY,
                targetY: visualY,
                containedTool: toolInside
            };
        }
    }
    saveGameState();
}

function updateToolButtonsHTML() {
    ["bomb", "rocket", "bee", "plane", "ufo"].forEach(t => {
        const btn = document.getElementById(`tool-${t}`);
        const cnt = document.getElementById(`count-${t}`);
        if(btn && cnt) {
            cnt.textContent = toolCounts[t];
            btn.classList.remove("selected");
            if(selectedTool === t) btn.classList.add("selected");
        }
    });
}

function selectTool(toolType) {
    if(toolCounts[toolType] <= 0) return;
    if(selectedTool === toolType) {
        selectedTool = null;
        hideCustomCursor();
    } else {
        selectedTool = toolType;
        showCustomCursor(TOOL_EMOJIS[toolType]);
    }
    updateToolButtonsHTML();
}

function showCustomCursor(emoji) {
    const cursorEl = document.getElementById("custom-cursor-tool");
    if(cursorEl) {
        cursorEl.textContent = emoji;
        cursorEl.style.display = "block";
    }
}

function hideCustomCursor() {
    const cursorEl = document.getElementById("custom-cursor-tool");
    if(cursorEl) cursorEl.style.display = "none";
}

function updateCustomCursorPos(e) {
    const cursorEl = document.getElementById("custom-cursor-tool");
    if(cursorEl && cursorEl.style.display === "block") {
        cursorEl.style.left = e.clientX + "px";
        cursorEl.style.top = e.clientY + "px";
    }
}

function createExplosion(r, c, color) {
    let startX = c * blockSize + blockSize / 2;
    let startY = r * blockSize + blockSize / 2;
    for(let i=0; i<10; i++) {
        particles.push({
            x: startX,
            y: startY,
            size: Math.random() * 5 + 4,
            color: color,
            dx: (Math.random() - 0.5) * 7,
            dy: (Math.random() - 0.5) * 7,
            life: 25
        });
    }
}

function spawnFlyingTool(toolType, targetR, targetC) {
    let targetX = targetC * blockSize + blockSize / 2;
    let targetY = targetR * blockSize + blockSize / 2;
    
    flyingTools.push({
        x: -40,
        y: targetY,
        targetX: targetX,
        targetY: targetY,
        targetR: targetR,
        targetC: targetC,
        speed: 18,
        type: toolType,
        emoji: TOOL_EMOJIS[toolType]
    });
}

function handleCollapseClick(e) {
    if(!canvasCol || isResettingRound) return;
    const rect = canvasCol.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    let c = Math.floor(x / blockSize);
    let r = Math.floor(y / blockSize);

    if(r >= 0 && r < COLLAPSE_ROWS && c >= 0 && c < COLLAPSE_COLS) {
        let block = collapseGrid[r][c];
        
        if(selectedTool) {
            if(!block.active) return;
            toolCounts[selectedTool]--;
            spawnFlyingTool(selectedTool, r, c);
            selectedTool = null;
            hideCustomCursor();
            updateToolButtonsHTML();
        } else if(block.active) {
            if(block.containedTool) {
                let collected = block.containedTool;
                toolCounts[collected]++;
                updateToolButtonsHTML();
                createExplosion(r, c, block.color);
                block.active = false;
                collapseScore += 25;
                if(collapseScoreEl) collapseScoreEl.textContent = collapseScore;
                
                showFeedbackText(`🎒 Coletou: ${TOOL_EMOJIS[collected]}`);
                applyGravity();
                handleEmptyColumns();
                checkCollapseGameEnd();
            } else {
                processCollapse(r, c);
            }
        }
    }
}

function showFeedbackText(txt) {
    const inst = document.getElementById("collapse-instructions");
    if(inst) {
        inst.textContent = txt;
        inst.style.color = "#ff7b93";
        setTimeout(() => { 
            inst.textContent = "Combine 5+ blocos para ganhar itens! • Colete itens no tabuleiro!"; 
            inst.style.color = "#a0aec0";
        }, 2200);
    }
}

function triggerToolEffect(toolType, r, c) {
    let explodedCount = 0;

    if(toolType === "bomb") {
        for(let i = r-1; i <= r+1; i++) {
            for(let j = c-1; j <= c+1; j++) {
                if(i >= 0 && i < COLLAPSE_ROWS && j >= 0 && j < COLLAPSE_COLS && collapseGrid[i][j].active) {
                    createExplosion(i, j, collapseGrid[i][j].color);
                    collapseGrid[i][j].active = false;
                    explodedCount++;
                }
            }
        }
    } else if(toolType === "rocket") {
        for(let j=0; j < COLLAPSE_COLS; j++) {
            if(collapseGrid[r][j].active) {
                createExplosion(r, j, collapseGrid[r][j].color);
                collapseGrid[r][j].active = false;
                explodedCount++;
            }
        }
    } else if(toolType === "bee") {
        for(let i=0; i < COLLAPSE_ROWS; i++) {
            if(collapseGrid[i][c].active) {
                createExplosion(i, c, collapseGrid[i][c].color);
                collapseGrid[i][c].active = false;
                explodedCount++;
            }
        }
    } else if(toolType === "plane") {
        let targetColor = collapseGrid[r][c].color;
        for(let i=0; i < COLLAPSE_ROWS; i++) {
            for(let j=0; j < COLLAPSE_COLS; j++) {
                if(collapseGrid[i][j].active && collapseGrid[i][j].color === targetColor) {
                    createExplosion(i, j, collapseGrid[i][j].color);
                    collapseGrid[i][j].active = false;
                    explodedCount++;
                }
            }
        }
    } else if(toolType === "ufo") {
        for(let j = c-1; j <= c+1; j++) {
            if (j >= 0 && j < COLLAPSE_COLS) {
                for(let i=0; i < COLLAPSE_ROWS; i++) {
                    if(collapseGrid[i][j].active) {
                        createExplosion(i, j, collapseGrid[i][j].color);
                        collapseGrid[i][j].active = false;
                        explodedCount++;
                    }
                }
            }
        }
    }

    if(explodedCount > 0) {
        collapseScore += explodedCount * 12;
        if(collapseScoreEl) collapseScoreEl.textContent = collapseScore;
        applyGravity();
        handleEmptyColumns();
        checkCollapseGameEnd();
    }
}

function getCollapseNeighbors(r, c, color) {
    let queue = [[r, c]];
    let connected = [];
    let visited = Array(COLLAPSE_ROWS).fill().map(() => Array(COLLAPSE_COLS).fill(false));

    while(queue.length > 0) {
        let [currR, currC] = queue.shift();
        if(currR < 0 || currR >= COLLAPSE_ROWS || currC < 0 || currC >= COLLAPSE_COLS) continue;
        if(visited[currR][currC] || !collapseGrid[currR][currC].active || collapseGrid[currR][currC].color !== color) continue;

        visited[currR][currC] = true;
        connected.push([currR, currC]);

        queue.push([currR - 1, currC], [currR + 1, currC], [currR, currC - 1], [currR, currC + 1]);
    }
    return connected;
}

function processCollapse(r, c) {
    let targetColor = collapseGrid[r][c].color;
    let matches = getCollapseNeighbors(r, c, targetColor);

    if(matches.length >= 2) {
        matches.forEach(([mr, mc]) => { 
            createExplosion(mr, mc, collapseGrid[mr][mc].color);
            collapseGrid[mr][mc].active = false; 
        });
        
        collapseScore += matches.length * 10;
        if(collapseScoreEl) collapseScoreEl.textContent = collapseScore;

        if(matches.length >= 5) {
            const listTools = ["bomb", "rocket", "bee", "plane", "ufo"];
            let reward = listTools[Math.floor(Math.random() * listTools.length)];
            toolCounts[reward]++;
            updateToolButtonsHTML();
            showFeedbackText(`🎁 RECOMPENSA COMBO! Ganhou: ${TOOL_EMOJIS[reward]}`);
        }

        applyGravity();
        handleEmptyColumns();
        checkCollapseGameEnd();
    }
}

function applyGravity() {
    for (let c = 0; c < COLLAPSE_COLS; c++) {
        for (let r = COLLAPSE_ROWS - 1; r >= 0; r--) {
            if (!collapseGrid[r][c].active) {
                for (let rAbove = r - 1; rAbove >= 0; rAbove--) {
                    if (collapseGrid[rAbove][c].active) {
                        collapseGrid[r][c].active = true;
                        collapseGrid[r][c].color = collapseGrid[rAbove][c].color;
                        collapseGrid[r][c].currentY = collapseGrid[rAbove][c].currentY;
                        collapseGrid[r][c].containedTool = collapseGrid[rAbove][c].containedTool;
                        collapseGrid[rAbove][c].active = false;
                        collapseGrid[rAbove][c].containedTool = null;
                        break;
                    }
                }
            }
        }
    }
    for(let r=0; r < COLLAPSE_ROWS; r++) {
        for(let c=0; c < COLLAPSE_COLS; c++) {
            collapseGrid[r][c].targetY = r * blockSize;
        }
    }
    saveGameState();
}

function handleEmptyColumns() {
    for (let c = 0; c < COLLAPSE_COLS - 1; c++) {
        if (!collapseGrid[COLLAPSE_ROWS - 1][c].active) {
            for (let nextC = c + 1; nextC < COLLAPSE_COLS; nextC++) {
                if (collapseGrid[COLLAPSE_ROWS - 1][nextC].active) {
                    for (let r = 0; r < COLLAPSE_ROWS; r++) {
                        collapseGrid[r][c].active = collapseGrid[r][nextC].active;
                        collapseGrid[r][c].color = collapseGrid[r][nextC].color;
                        collapseGrid[r][c].currentY = collapseGrid[r][nextC].currentY;
                        collapseGrid[r][c].containedTool = collapseGrid[r][nextC].containedTool;
                        collapseGrid[r][nextC].active = false;
                        collapseGrid[r][nextC].containedTool = null;
                    }
                    break;
                }
            }
        }
    }
    for(let r=0; r < COLLAPSE_ROWS; r++) {
        for(let c=0; c < COLLAPSE_COLS; c++) {
            collapseGrid[r][c].targetY = r * blockSize;
        }
    }
    saveGameState();
}

function updateCollapseState() {
    for(let r=0; r < COLLAPSE_ROWS; r++) {
        for(let c=0; c < COLLAPSE_COLS; c++) {
            let b = collapseGrid[r][c];
            if(b.active && b.currentY < b.targetY) {
                b.currentY += 5;
                if(b.currentY > b.targetY) b.currentY = b.targetY;
            }
        }
    }

    for(let i = flyingTools.length - 1; i >= 0; i--) {
        let ft = flyingTools[i];
        let angle = Math.atan2(ft.targetY - ft.y, ft.targetX - ft.x);
        ft.x += Math.cos(angle) * ft.speed;
        ft.y += Math.sin(angle) * ft.speed;

        if(Math.hypot(ft.targetX - ft.x, ft.targetY - ft.y) < ft.speed) {
            triggerToolEffect(ft.type, ft.targetR, ft.targetC);
            flyingTools.splice(i, 1);
        }
    }

    for(let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.dx; p.y += p.dy;
        p.life--;
        if(p.life <= 0) particles.splice(i, 1);
    }
}

function drawCollapseGame() {
    if(!canvasCol) return;
    ctxCol.fillStyle = "#f0f4f8";
    ctxCol.fillRect(0, 0, canvasCol.width, canvasCol.height);

    for(let r=0; r < COLLAPSE_ROWS; r++) {
        for(let c=0; c < COLLAPSE_COLS; c++) {
            let block = collapseGrid[r][c];
            if(block.active) {
                ctxCol.save();
                ctxCol.fillStyle = block.color;
                ctxCol.beginPath();
                ctxCol.roundRect(c * blockSize + 2, block.currentY + 2, blockSize - 4, blockSize - 4, 8);
                ctxCol.fill();
                
                if(block.containedTool) {
                    ctxCol.font = "1.3rem Arial";
                    ctxCol.textAlign = "center";
                    ctxCol.textBaseline = "middle";
                    ctxCol.fillText(TOOL_EMOJIS[block.containedTool], c * blockSize + blockSize/2, block.currentY + blockSize/2);
                } else {
                    ctxCol.fillStyle = "rgba(255,255,255,0.3)";
                    ctxCol.beginPath();
                    ctxCol.roundRect(c * blockSize + 6, block.currentY + 6, blockSize - 25, 8, 4);
                    ctxCol.fill();
                }
                ctxCol.restore();
            }
        }
    }

    flyingTools.forEach(ft => {
        ctxCol.save();
        ctxCol.font = "2rem Arial";
        ctxCol.textAlign = "center";
        ctxCol.textBaseline = "middle";
        ctxCol.fillText(ft.emoji, ft.x, ft.y);
        ctxCol.restore();
    });

    particles.forEach(p => {
        ctxCol.save();
        ctxCol.fillStyle = p.color;
        ctxCol.globalAlpha = p.life / 25;
        ctxCol.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctxCol.restore();
    });
}

function checkCollapseGameEnd() {
    if (isResettingRound) return;

    let activeCount = 0;
    let hasMoves = false;

    for(let r=0; r < COLLAPSE_ROWS; r++) {
        for(let c=0; c < COLLAPSE_COLS; c++) {
            if(collapseGrid[r][c].active) {
                activeCount++;
                let matches = getCollapseNeighbors(r, c, collapseGrid[r][c].color);
                if(matches.length >= 2) hasMoves = true;
            }
        }
    }

    if(activeCount === 0) {
        isResettingRound = true;
        setTimeout(() => {
            currentRound++;
            collapseScore += 500; 
            if(collapseScoreEl) collapseScoreEl.textContent = collapseScore;
            showFeedbackText(`🎉 RODADA ${currentRound}! Novo campo gerado (+500 pts)`);
            generateNewRoundGrid();
        }, 300);
        return;
    }

    if(!hasMoves) {
        let totalToolsAvailable = toolCounts.bomb + toolCounts.rocket + toolCounts.bee + toolCounts.plane + toolCounts.ufo;
        
        if (totalToolsAvailable > 0) {
            const inst = document.getElementById("collapse-instructions");
            if(inst) {
                inst.textContent = "⚠️ Sem combinações! Use suas ferramentas para abrir caminho!";
                inst.style.color = "#ff9f43";
            }
        } else {
            isResettingRound = true;
            // Limpa o save do jogo atual porque deu Game Over de verdade
            localStorage.removeItem("collapse_save_state");
            
            setTimeout(() => {
                let name = prompt(`🐾 Fim de Jogo! Acabaram suas opções.\nPontuação Final: ${collapseScore}\nNome do Pet:`);
                if (!name || name.trim() === "") name = "Bichinho";

                let records = JSON.parse(localStorage.getItem("collapse_records")) || [];
                records.push({ name: name.substring(0, 12), score: collapseScore });
                records.sort((a, b) => b.score - a.score);
                records = records.slice(0, 5);
                localStorage.setItem("collapse_records", JSON.stringify(records));
                
                startFreshGame();
                initCollapseGame();
            }, 500);
        }
    } else {
        // Salva o estado se o jogo ainda continuar normalmente após as modificações de campo
        saveGameState();
    }
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
}

function collapseGameLoop() {
    if(document.getElementById("canvas-collapse")) {
        updateCollapseState();
        drawCollapseGame();
        requestAnimationFrame(collapseGameLoop);
    }
}