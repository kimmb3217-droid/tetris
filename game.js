// game.js
// Tetris Neon Kineticism: DOM Rendering Engine

const boardEl = document.getElementById('game-board');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const nextGridEl = document.getElementById('next-piece-grid');
const heldGridEl = document.getElementById('held-piece-grid');
const mobileNextGridEl = document.getElementById('mobile-next-grid');
const mobileHeldGridEl = document.getElementById('mobile-held-grid');
const restartBtn = document.getElementById('restart-btn');
const modal = document.getElementById('game-over-modal');
const finalScoreEl = document.getElementById('final-score');

let board = new Board(); // COLS=10, ROWS=20
let currentPiece = null;
let nextPiece = null;
let heldPiece = null;
let canHold = true;

let score = 0;
let lines = 0;
let level = 1;
let requestAnimationId = null;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

const KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    DOWN: 'ArrowDown',
    UP: 'ArrowUp',
    SPACE: ' ',
    HOLD: 'c',
    HOLD_ALT: 'C',
    SHIFT: 'Shift'
};

function init() {
    board.reset();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    heldPiece = null;
    canHold = true;
    
    updateScore();
    
    currentPiece = getRandomPiece();
    nextPiece = getRandomPiece();
    
    modal.classList.add('hidden');
    
    if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId);
    }
    
    lastTime = 0;
    draw();
    requestAnimationId = requestAnimationFrame(update);
}

function getRandomPiece() {
    const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const type = types[Math.floor(Math.random() * types.length)];
    return new Tetromino(type);
}

// ---------------- 렌더링 엔진 (DOM 기반) ----------------

function createBlockElement(x, y, colorClass, type = 'normal') {
    const cell = document.createElement('div');
    cell.className = `block-cell ${type === 'ghost' ? 'ghost-piece' : ''}`;
    cell.style.left = `${x * 10}%`;
    cell.style.top = `${y * 5}%`;
    
    const block = document.createElement('div');
    block.className = type === 'ghost' ? `ghost-block text-block-${colorClass}` : `tetris-block block-${colorClass}`;
    if (type === 'ghost') {
        // 고스트 피스는 디자인 요구사항에 따라 currentColor (border) 사용
        block.style.color = getHexForType(colorClass);
    }
    
    cell.appendChild(block);
    return cell;
}

function getHexForType(type) {
    const hex = {
        I: '#00f0f0', J: '#0000f0', L: '#f0a000', O: '#f0f000', S: '#00f000', T: '#a000f0', Z: '#f00000'
    };
    return hex[type] || '#fff';
}

function draw() {
    // 1. 보드 비우기
    boardEl.innerHTML = '';
    
    // 2. 고스트 피스 그리기
    const ghost = getGhostPiece();
    drawPieceToContainer(boardEl, ghost, 'ghost');
    
    // 3. 현재 피스 그리기
    drawPieceToContainer(boardEl, currentPiece);
    
    // 4. 이미 쌓인 보드 블록 그리기
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board.grid[r][c] !== 0) {
                const el = createBlockElement(c, r, board.grid[r][c]);
                boardEl.appendChild(el);
            }
        }
    }
    
    // 5. 사이드 패널 업데이트 (Next, Held)
    updateSidePanels();
}

function drawPieceToContainer(container, piece, type = 'normal') {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c] !== 0) {
                const el = createBlockElement(piece.x + c, piece.y + r, piece.color, type);
                container.appendChild(el);
            }
        }
    }
}

function updateSidePanels() {
    renderSmallGrid(nextGridEl, nextPiece);
    renderSmallGrid(mobileNextGridEl, nextPiece);
    
    if (heldPiece) {
        renderSmallGrid(heldGridEl, heldPiece);
        renderSmallGrid(mobileHeldGridEl, heldPiece);
    } else {
        heldGridEl.innerHTML = '';
        mobileHeldGridEl.innerHTML = '';
    }
}

function renderSmallGrid(container, piece) {
    container.innerHTML = '';
    
    // 4x4 그리드 생성 (디자인 시안에 따라 grid-cols-4 등 적용됨)
    // 위치 보정: 4x4 내 중앙 정렬
    const size = piece.type === 'I' ? 4 : (piece.type === 'O' ? 2 : 3);
    const offset = (4 - size) / 2;
    
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c] !== 0) {
                const block = document.createElement('div');
                block.className = `aspect-square tetris-block block-${piece.color}`;
                // Tailwind grid child position: (r+1) / (c+1) but since we use raw divs in a grid, we just append in order?
                // No, better to use absolute mapping if it's a fixed grid, 
                // but for simplicity, we can just use 16 empty divs and overwrite the ones we need.
            }
        }
    }
    
    // 더 간단한 방법: 4x4 fixed grid를 사용하고 조각 모양에 맞춰 채우기
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(4, 1fr)';
    container.style.gridTemplateRows = 'repeat(4, 1fr)';
    
    const cells = Array.from({length: 16}, () => document.createElement('div'));
    cells.forEach(c => {
        c.className = 'aspect-square'; 
        container.appendChild(c);
    });
    
    const startRow = Math.floor((4 - piece.shape.length) / 2);
    const startCol = Math.floor((4 - piece.shape[0].length) / 2);
    
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c] !== 0) {
                const index = (startRow + r) * 4 + (startCol + c);
                if (index >= 0 && index < 16) {
                    cells[index].className = `aspect-square tetris-block block-${piece.color}`;
                }
            }
        }
    }
}

// ---------------- 게임 로직 ----------------

function getGhostPiece() {
    const ghost = new Tetromino(currentPiece.type);
    ghost.shape = currentPiece.shape;
    ghost.x = currentPiece.x;
    ghost.y = currentPiece.y;
    
    while (board.isValidPos(ghost, ghost.x, ghost.y + 1)) {
        ghost.y++;
    }
    return ghost;
}

function hold() {
    if (!canHold) return;
    
    if (heldPiece === null) {
        heldPiece = new Tetromino(currentPiece.type);
        currentPiece = nextPiece;
        nextPiece = getRandomPiece();
    } else {
        const temp = heldPiece.type;
        heldPiece = new Tetromino(currentPiece.type);
        currentPiece = new Tetromino(temp);
    }
    
    canHold = false;
    draw();
}

function drop() {
    if (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    } else {
        board.merge(currentPiece);
        
        if (currentPiece.y <= 0) {
            gameOver();
            return;
        }

        const cleared = board.clearLines();
        if (cleared > 0) {
            lines += cleared;
            // 라인 제거 별 점수 가중치 1->100, 2->300, 3->500, 4->800
            const pts = [0, 100, 300, 500, 800];
            score += pts[cleared] * level; // 레벨 배수 적용
            
            // 레벨업 로직 (10줄마다)
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                // 최소 100ms까지 속도 증가
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            }
            
            updateScore();
        }

        currentPiece = nextPiece;
        nextPiece = getRandomPiece();
        canHold = true; // 새로운 피스가 나오면 Hold 가능

        if (!board.isValidPos(currentPiece, currentPiece.x, currentPiece.y)) {
            gameOver();
        }
    }
    dropCounter = 0;
}

function hardDrop() {
    let bonus = 0;
    while (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        bonus += 2;
    }
    score += bonus;
    drop();
    updateScore();
}

function updateScore() {
    scoreEl.innerText = score.toLocaleString(); // 디자인에 맞춰 콤마 추가
    linesEl.innerText = lines;
    levelEl.innerText = level;
}

function gameOver() {
    cancelAnimationFrame(requestAnimationId);
    requestAnimationId = null;
    finalScoreEl.innerText = score.toLocaleString();
    modal.classList.remove('hidden');
}

function update(time = 0) {
    if (!lastTime) lastTime = time;
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
    }

    draw();

    if (requestAnimationId) {
        requestAnimationId = requestAnimationFrame(update);
    }
}

// ---------------- 제어 ----------------

document.addEventListener('keydown', event => {
    if (Object.values(KEYS).includes(event.key)) {
        event.preventDefault();
    }
    
    if (!modal.classList.contains('hidden')) return;

    switch (event.key) {
        case KEYS.LEFT:
            if (board.isValidPos(currentPiece, currentPiece.x - 1, currentPiece.y)) {
                currentPiece.x--;
                draw();
            }
            break;
        case KEYS.RIGHT:
            if (board.isValidPos(currentPiece, currentPiece.x + 1, currentPiece.y)) {
                currentPiece.x++;
                draw();
            }
            break;
        case KEYS.DOWN:
            if (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
                currentPiece.y++;
                score += 1;
                updateScore();
                draw();
            }
            break;
        case KEYS.UP:
            const rotated = currentPiece.getRotatedShape();
            if (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y, rotated)) {
                currentPiece.rotate();
                draw();
            }
            break;
        case KEYS.SPACE:
            hardDrop();
            draw();
            break;
        case KEYS.HOLD:
        case KEYS.HOLD_ALT:
        case KEYS.SHIFT:
            hold();
            break;
    }
});

restartBtn.addEventListener('click', init);

init();
