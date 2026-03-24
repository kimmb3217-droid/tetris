// game.js
// 게임 메인 루프, 렌더링, 키보드 입력 및 보드/스코어 관리를 담당합니다.

const canvas = document.getElementById('tetris-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-block-board');
const nextCtx = nextCanvas.getContext('2d');

const BLOCK_SIZE = 30; // 300 / 10 = 30
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
// 다음 블록 캔버스는 120x120 -> 4x4 블록 크기로 스케일
nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const restartBtn = document.getElementById('restart-btn');
const modal = document.getElementById('game-over-modal');
const finalScoreEl = document.getElementById('final-score');

let board = new Board();
let currentPiece = null;
let nextPiece = null;

let score = 0;
let lines = 0;
let requestAnimationId = null;

// 시간 제어 변수
let dropCounter = 0;
let dropInterval = 1000; // 1초마다 자동 하강
let lastTime = 0;

// 조작 관련
const KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    DOWN: 'ArrowDown',
    UP: 'ArrowUp',
    SPACE: ' '
};

function init() {
    board.reset();
    score = 0;
    lines = 0;
    dropInterval = 1000;
    updateScore();
    
    currentPiece = getRandomPiece();
    nextPiece = getRandomPiece();
    
    modal.classList.add('hidden');
    
    if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId);
    }
    
    lastTime = 0;
    draw(); // 초기 렌더링
    requestAnimationId = requestAnimationFrame(update);
}

function getRandomPiece() {
    const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const type = types[Math.floor(Math.random() * types.length)];
    return new Tetromino(type);
}

// 개별 블록 그리기 (입체감 추가)
function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
    
    // 블록의 얇은 테두리/그림자 효과를 주어 세련되게 표현
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x, y, 1, 0.1); // top
    context.fillRect(x, y, 0.1, 1); // left
    
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.fillRect(x, y + 0.9, 1, 0.1); // bottom
    context.fillRect(x + 0.9, y, 0.1, 1); // right
}

function drawBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board.grid[r][c] !== 0) {
                drawBlock(ctx, c, r, board.grid[r][c]);
            }
        }
    }
}

function drawPiece(context, piece, offsetX = 0, offsetY = 0) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c] !== 0) {
                drawBlock(context, piece.x + c + offsetX, piece.y + r + offsetY, piece.color);
            }
        }
    }
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width / BLOCK_SIZE, nextCanvas.height / BLOCK_SIZE);
    
    // 블록을 4x4 캔버스 중앙에 오게 하기 위한 계산
    const noopOffset = nextPiece.type === 'O' || nextPiece.type === 'I' ? 0.5 : 0;
    const offsetX = (4 - nextPiece.shape[0].length) / 2 - nextPiece.x + noopOffset;
    const offsetY = (4 - nextPiece.shape.length) / 2 - nextPiece.y + noopOffset;

    drawPiece(nextCtx, nextPiece, offsetX, offsetY);
}

function draw() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width / BLOCK_SIZE, canvas.height / BLOCK_SIZE);
    drawBoard();
    drawPiece(ctx, currentPiece);
    drawNextPiece();
}

// 한 칸 하강
function drop() {
    if (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    } else {
        // 더 이상 내려갈 수 없으면 바닥(또는 다른 블록)에 병합
        board.merge(currentPiece);
        
        // 병합된 블록 중 천장(y=0) 이상에 있는 게 있다면 게임 오버
        if (currentPiece.y < 0) {
            gameOver();
            return;
        }

        // 라인 클리어 및 점수 계산
        const cleared = board.clearLines();
        if (cleared > 0) {
            lines += cleared;
            // 라인 제거 별 점수 가중치 1->100, 2->300, 3->500, 4->800
            const pts = [0, 100, 300, 500, 800];
            score += pts[cleared];
            // 속도 빨라지게 (최소 100ms)
            dropInterval = Math.max(100, 1000 - (lines * 10));
            updateScore();
        }

        currentPiece = nextPiece;
        nextPiece = getRandomPiece();

        // 새 피스가 생성되자마자 충돌하면 게임 오버
        if (!board.isValidPos(currentPiece, currentPiece.x, currentPiece.y)) {
            gameOver();
        }
    }
    dropCounter = 0;
}

// 스페이스바 하드 드롭
function hardDrop() {
    while (board.isValidPos(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        score += 2; // 하드 드롭 보너스 점수
    }
    drop();
    updateScore();
}

function updateScore() {
    scoreEl.innerText = score;
    linesEl.innerText = lines;
}

function gameOver() {
    cancelAnimationFrame(requestAnimationId);
    requestAnimationId = null;
    finalScoreEl.innerText = score;
    modal.classList.remove('hidden');
}

// 메인 루프 (requestAnimationFrame)
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

// 키보드 입력
document.addEventListener('keydown', event => {
    // 키 입력 기본 동작 방지(방향키 스크롤, 스페이스바 페이지 넘김 등)
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
                score += 1; // 소프트 드롭 보너스
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
    }
});

restartBtn.addEventListener('click', init);

// 게임 최초 시작
init();
