const PET_EMOJIS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];

let canvasMem, ctxMem, scoreEl, movesEl;
const MEM_ROWS = 4;
const MEM_COLS = 4;
let cardSize;

let cards = [];
let selectedCards = [];
let memoryScore = 0;
let memoryMoves = 0;
let comboMultiplier = 1;
let lockBoard = false;

function initMemoryGame() {
    canvasMem = document.getElementById("canvas-memory");
    if (!canvasMem) return;
    ctxMem = canvasMem.getContext("2d");
    scoreEl = document.getElementById("memory-score");
    movesEl = document.getElementById("memory-moves");

    cardSize = canvasMem.width / MEM_COLS;

    // Carrega o jogo salvo ou cria um do zero
    const savedState = localStorage.getItem("pet_memory_save_state");
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            cards = state.cards;
            memoryScore = state.score;
            memoryMoves = state.moves;
            comboMultiplier = state.combo;
            selectedCards = []; // Limpa seleções pendentes travadas
            lockBoard = false;
        } catch (e) {
            startFreshMemoryGame();
        }
    } else {
        startFreshMemoryGame();
    }

    updateMemoryUI();
    canvasMem.removeEventListener("click", handleMemoryClick);
    canvasMem.addEventListener("click", handleMemoryClick);

    memoryGameLoop();
}

function startFreshMemoryGame() {
    memoryScore = 0;
    memoryMoves = 0;
    comboMultiplier = 1;
    selectedCards = [];
    lockBoard = false;
    generateDeck();
}

function generateDeck() {
    // Duplica os emojis para criar os pares (8 espécies * 2 = 16 cartas)
    let deck = [...PET_EMOJIS, ...PET_EMOJIS];
    
    // Algoritmo de Fisher-Yates para embaralhar
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    cards = [];
    let index = 0;
    for (let r = 0; r < MEM_ROWS; r++) {
        for (let c = 0; c < MEM_COLS; c++) {
            cards.push({
                row: r,
                col: c,
                emoji: deck[index],
                isFlipped: false,
                isMatched: false
            });
            index++;
        }
    }
    saveMemoryState();
}

function saveMemoryState() {
    const state = {
        cards: cards,
        score: memoryScore,
        moves: memoryMoves,
        combo: comboMultiplier
    };
    localStorage.setItem("pet_memory_save_state", JSON.stringify(state));
}

function resetMemoryGameBtn() {
    if (confirm("Deseja reiniciar a partida atual?")) {
        localStorage.removeItem("pet_memory_save_state");
        startFreshMemoryGame();
        updateMemoryUI();
        document.getElementById("memory-instructions").textContent = "Tabuleiro reiniciado! Encontre os pares.";
    }
}

function updateMemoryUI() {
    if (scoreEl) scoreEl.textContent = memoryScore;
    if (movesEl) movesEl.textContent = memoryMoves;
}

function handleMemoryClick(e) {
    if (lockBoard) return;

    const rect = canvasMem.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    let c = Math.floor(x / cardSize);
    let r = Math.floor(y / cardSize);

    // Encontra a carta clicada
    let clickedCard = cards.find(card => card.row === r && card.col === c);

    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Vira a carta
    clickedCard.isFlipped = true;
    selectedCards.push(clickedCard);
    saveMemoryState();

    if (selectedCards.length === 2) {
        memoryMoves++;
        lockBoard = true;
        checkMatch();
    }
}

function checkMatch() {
    let [card1, card2] = selectedCards;

    if (card1.emoji === card2.emoji) {
        // Acertou!
        card1.isMatched = true;
        card2.isMatched = true;
        
        let pointsEarned = 100 * comboMultiplier;
        memoryScore += pointsEarned;
        
        const inst = document.getElementById("memory-instructions");
        if(comboMultiplier > 1) {
            inst.textContent = `🔥 COMBO x${comboMultiplier}! +${pointsEarned} pontos!`;
        } else {
            inst.textContent = `✨ Par encontrado! +100 pontos.`;
        }

        comboMultiplier++;
        selectedCards = [];
        lockBoard = false;
        updateMemoryUI();
        saveMemoryState();
        checkGameEnd();
    } else {
        // Errou!
        comboMultiplier = 1; // Reseta o combo
        memoryScore = Math.max(0, memoryScore - 10);
        document.getElementById("memory-instructions").textContent = "❌ Não foi dessa vez... tentando de novo!";

        setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            selectedCards = [];
            lockBoard = false;
            updateMemoryUI();
            saveMemoryState();
        }, 1000);
    }
}

function checkGameEnd() {
    const allMatched = cards.every(card => card.isMatched);
    if (allMatched) {
        localStorage.removeItem("pet_memory_save_state"); // Limpa o save antigo pós-vitoria
        setTimeout(() => {
            alert(`🎉 Parabéns! Você completou o Jogo da Memória!\nPontuação: ${memoryScore}\nTentativas: ${memoryMoves}`);
            startFreshMemoryGame();
            updateMemoryUI();
        }, 500);
    }
}

function drawMemoryGame() {
    if (!canvasMem) return;
    ctxMem.clearRect(0, 0, canvasMem.width, canvasMem.height);

    // Cor de fundo do tabuleiro
    ctxMem.fillStyle = "#f0f4f8";
    ctxMem.fillRect(0, 0, canvasMem.width, canvasMem.height);

    cards.forEach(card => {
        ctxMem.save();
        
        let x = card.col * cardSize + 6;
        let y = card.row * cardSize + 6;
        let w = cardSize - 12;
        let h = cardSize - 12;

        if (card.isFlipped || card.isMatched) {
            // Frente da Carta (Aberta)
            ctxMem.fillStyle = "#ffffff";
            ctxMem.beginPath();
            ctxMem.roundRect(x, y, w, h, 12);
            ctxMem.fill();
            
            // Borda fina cinza para destacar cartas brancas
            ctxMem.lineWidth = 2;
            ctxMem.strokeStyle = card.isMatched ? "#1dd1a1" : "#e2e8f0";
            ctxMem.stroke();

            // Desenha o Emoji do Pet
            ctxMem.font = "2.2rem Arial";
            ctxMem.textAlign = "center";
            ctxMem.textBaseline = "middle";
            ctxMem.fillText(card.emoji, x + w / 2, y + h / 2);
        } else {
            // Verso da Carta (Fechada)
            ctxMem.fillStyle = "#54a0ff"; // Cor azul bonita para o verso
            ctxMem.beginPath();
            ctxMem.roundRect(x, y, w, h, 12);
            ctxMem.fill();

            // Símbolo de interrogação ou decoração no verso
            ctxMem.font = "2rem Arial";
            ctxMem.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctxMem.textAlign = "center";
            ctxMem.textBaseline = "middle";
            ctxMem.fillText("❓", x + w / 2, y + h / 2);
        }

        ctxMem.restore();
    });
}

function memoryGameLoop() {
    if (document.getElementById("canvas-memory")) {
        drawMemoryGame();
        requestAnimationFrame(memoryGameLoop);
    }
}