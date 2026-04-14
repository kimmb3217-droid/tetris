// game.js
// NEON TETRIX - Kinetic Observatory Rendering Engine

// --- DOM Elements ---
const globalNav = document.getElementById('global-nav');
const boardEl = document.getElementById('game-board');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const nextGridEl = document.getElementById('next-piece-grid');
const heldGridEl = document.getElementById('held-piece-grid');
const bestScoreHudEl = document.getElementById('best-score-hud');
const ingameNewRecordEl = document.getElementById('ingame-new-record');

const finalScoreEl = document.getElementById('final-score');
const finalLinesEl = document.getElementById('final-lines');
const finalLevelEl = document.getElementById('final-level');
const newHighScoreBadge = document.getElementById('new-high-score-badge');

const screens = {
    home: document.getElementById('screen-home'),
    play: document.getElementById('screen-play'),
    gameOver: document.getElementById('screen-gameover'),
    rank: document.getElementById('screen-rank'),
    user: document.getElementById('screen-user')
};

const homeBestScoreEl = document.getElementById('home-best-score');

// --- Game State ---
let board = new Board();
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
let isPaused = false;

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

// --- Screen Management ---
function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    if (screens[screenKey]) {
        screens[screenKey].classList.remove('hidden');
    }
    
    // Close drawer when switching screens
    closeDrawer();
    
    // Toggle global nav visibility (always keep visible as requested)
    globalNav.classList.remove('hidden');

    // Stop game loop if not on play screen
    if (screenKey !== 'play') {
        if (requestAnimationId) {
            cancelAnimationFrame(requestAnimationId);
            requestAnimationId = null;
        }
    }
}

// --- Initialization ---
function init() {
    board.reset();
    score = 0;
    displayedScore = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    heldPiece = null;
    canHold = true;
    isPaused = false;
    updateScore();
    if (ingameNewRecordEl) ingameNewRecordEl.classList.add('hidden');
    
    const best = parseInt(localStorage.getItem('neon-tetris-best') || '0');
    if (bestScoreHudEl) bestScoreHudEl.innerText = best.toLocaleString();
    
    currentPiece = getRandomPiece();
    nextPiece = getRandomPiece();
    
    if (newHighScoreBadge) newHighScoreBadge.classList.add('hidden');
    
    showScreen('play');
    
    // Ensure Phaser is initialized and visible
    window.initPhaser();
    
    lastTime = 0;
    // draw(); // Removed DOM draw
    window.updatePhaserGame(board, currentPiece, getGhostPiece());
    window.updatePhaserNext(nextPiece);
    window.updatePhaserHeld(heldPiece);
    
    requestAnimationId = requestAnimationFrame(update);
}

function getRandomPiece() {
    const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const type = types[Math.floor(Math.random() * types.length)];
    return new Tetromino(type);
}

// --- Rendering Logic ---

function draw() {
    // Moved to Phaser rendering in phaser-game.js
    window.updatePhaserGame(board, currentPiece, getGhostPiece());
    updateSidePanels();
}

function updateSidePanels() {
    window.updatePhaserNext(nextPiece);
    window.updatePhaserHeld(heldPiece);
}

// --- Game Logic ---
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
            const pts = [0, 100, 300, 500, 800];
            score += pts[cleared] * level;
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            }
            updateScore();
        }
        currentPiece = nextPiece;
        nextPiece = getRandomPiece();
        canHold = true;
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

let displayedScore = 0;
function updateScore() {
    // Smooth score count-up
    const diff = score - displayedScore;
    if (diff > 0) {
        displayedScore += Math.ceil(diff / 10);
        if (displayedScore > score) displayedScore = score;
        scoreEl.innerText = displayedScore.toLocaleString();
        
        // Pulse effect
        scoreEl.classList.add('scale-105', 'text-primary');
        setTimeout(() => scoreEl.classList.remove('scale-105'), 100);
        
        if (displayedScore < score) {
            requestAnimationFrame(updateScore);
        }
    } else {
        scoreEl.innerText = score.toLocaleString();
    }

    linesEl.innerText = lines;
    levelEl.innerText = level;
    
    // Live high score check
    const best = parseInt(localStorage.getItem('neon-tetris-best') || '0');
    if (score > best && best > 0) {
        if (ingameNewRecordEl) {
            if (ingameNewRecordEl.classList.contains('hidden')) {
                // First time breaking the record in this session
                ingameNewRecordEl.classList.remove('hidden');
                // Optional: Add a sound or major effect here
            }
        }
    }
}

function updateHighScore() {
    const best = parseInt(localStorage.getItem('neon-tetris-best') || '0');
    if (score > best) {
        localStorage.setItem('neon-tetris-best', score.toString());
        if (newHighScoreBadge) newHighScoreBadge.classList.remove('hidden');
    }
    if (homeBestScoreEl) {
        homeBestScoreEl.innerText = Math.max(best, score).toLocaleString();
    }
}

function gameOver() {
    if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId);
        requestAnimationId = null;
    }
    finalScoreEl.innerText = score.toLocaleString();
    finalLinesEl.innerText = lines;
    finalLevelEl.innerText = level;
    updateHighScore();
    showScreen('gameOver');
}

function update(time = 0) {
    if (isPaused) return;
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

// --- Event Listeners ---

// Navigation
document.getElementById('start-game-btn').addEventListener('click', init);
document.getElementById('restart-btn').addEventListener('click', init);
// Navigation (Drawer)
const navOverlay = document.getElementById('nav-overlay');
const navDrawer = document.getElementById('nav-drawer');
const menuBtn = document.getElementById('menu-btn');
const closeDrawerBtn = document.getElementById('close-drawer-btn');

function openDrawer() {
    navOverlay.classList.remove('hidden');
    setTimeout(() => {
        navOverlay.classList.add('active');
        navDrawer.classList.add('active');
    }, 10);
}

function closeDrawer() {
    navOverlay.classList.remove('active');
    navDrawer.classList.remove('active');
    setTimeout(() => {
        navOverlay.classList.add('hidden');
    }, 300);
}

if (menuBtn) menuBtn.addEventListener('click', openDrawer);
if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
if (navOverlay) navOverlay.addEventListener('click', closeDrawer);

document.getElementById('drawer-nav-home').addEventListener('click', () => showScreen('home'));
document.getElementById('drawer-nav-play').addEventListener('click', () => {
    if (screens.play.classList.contains('hidden')) {
        init();
    } else {
        closeDrawer();
    }
});
document.getElementById('drawer-nav-rank').addEventListener('click', () => showScreen('rank'));
document.getElementById('drawer-nav-user').addEventListener('click', () => showScreen('user'));

document.getElementById('go-home-btn').addEventListener('click', () => {
    updateHighScore();
    showScreen('home');
});

// Buttons and Actions
function handleControl(action) {
    if (screens.play.classList.contains('hidden') || isPaused) return;
    
    switch(action) {
        case 'left':
            if (board.isValidPos(currentPiece, currentPiece.x - 1, currentPiece.y)) {
                currentPiece.x--; draw();
            }
            break;
        case 'right':
            if (board.isValidPos(currentPiece, currentPiece.x + 1, currentPiece.y)) {
                currentPiece.x++; draw();
            }
            break;
        case 'rotate':
            const rotated = currentPiece.getRotatedShape();
            if (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y, rotated)) {
                currentPiece.rotate(); draw();
            }
            break;
        case 'down':
            drop(); draw();
            break;
        case 'hold':
            hold();
            break;
    }
}

document.getElementById('ctrl-left').addEventListener('pointerdown', (e) => { e.preventDefault(); handleControl('left'); });
document.getElementById('ctrl-right').addEventListener('pointerdown', (e) => { e.preventDefault(); handleControl('right'); });
document.getElementById('ctrl-rotate').addEventListener('pointerdown', (e) => { e.preventDefault(); handleControl('rotate'); });
document.getElementById('ctrl-down').addEventListener('pointerdown', (e) => { e.preventDefault(); handleControl('down'); });
document.getElementById('ctrl-hold').addEventListener('pointerdown', (e) => { e.preventDefault(); handleControl('hold'); });


// Key Controls
document.addEventListener('keydown', event => {
    if (Object.values(KEYS).includes(event.key)) {
        event.preventDefault();
    }
    if (screens.play.classList.contains('hidden')) return;
    
    switch (event.key) {
        case KEYS.LEFT:
            if (board.isValidPos(currentPiece, currentPiece.x - 1, currentPiece.y)) {
                currentPiece.x--; draw();
            }
            break;
        case KEYS.RIGHT:
            if (board.isValidPos(currentPiece, currentPiece.x + 1, currentPiece.y)) {
                currentPiece.x++; draw();
            }
            break;
        case KEYS.DOWN:
            if (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
                currentPiece.y++; score += 1; updateScore(); draw();
            }
            break;
        case KEYS.UP:
            const rotated = currentPiece.getRotatedShape();
            if (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y, rotated)) {
                currentPiece.rotate(); draw();
            }
            break;
        case KEYS.SPACE:
            hardDrop(); draw();
            break;
        case KEYS.HOLD:
        case KEYS.HOLD_ALT:
        case KEYS.SHIFT:
            hold();
            break;
    }
});

// Initial Home Screen load
function startApp() {
    const best = parseInt(localStorage.getItem('neon-tetris-best') || '0');
    if (homeBestScoreEl) homeBestScoreEl.innerText = best.toLocaleString();
    showScreen('home');
}

startApp();
