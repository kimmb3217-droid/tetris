// board.js
// 10x20 크기의 게임 보드와 충돌 처리, 라인 클리어를 관리합니다.

const COLS = 10;
const ROWS = 20;

class Board {
    constructor() {
        this.grid = this.getEmptyGrid();
    }

    // 빈 2차원 배열 보드 생성
    getEmptyGrid() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    // 초기화
    reset() {
        this.grid = this.getEmptyGrid();
    }

    // 테트로미노가 새로운 위치나 형태로 갈 수 있는지 보드 상 충돌 검사
    isValidPos(tetromino, destX, destY, destShape) {
        const shape = destShape || tetromino.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const newX = destX + c;
                    const newY = destY + r;

                    // 좌/우 벽이나 바닥 충돌
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }

                    // 위쪽에서 넘어간 상태는 충돌이 아님 (화면에만 안 보일 뿐)
                    if (newY < 0) {
                        continue;
                    }

                    // 이미 쌓인 블록과 겹침 검사
                    if (this.grid[newY][newX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // 블록을 보드에 굳히기(Merge)
    merge(tetromino) {
        for (let r = 0; r < tetromino.shape.length; r++) {
            for (let c = 0; c < tetromino.shape[r].length; c++) {
                if (tetromino.shape[r][c] !== 0) {
                    const boardY = tetromino.y + r;
                    const boardX = tetromino.x + c;
                    // 보드 구간 내에만 색상 칠하기
                    if (boardY >= 0) {
                        this.grid[boardY][boardX] = tetromino.color;
                    }
                }
            }
        }
    }

    // 꽉 찬 줄 삭제 및 개수 반환
    clearLines() {
        let linesCleared = 0;

        // 제일 아래 줄부터 위로 올라가면서 검사
        for (let r = ROWS - 1; r >= 0; r--) {
            // 한 줄이 모두 0이 아닌지 확인 (꽉 차 있는지)
            let isFull = true;
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c] === 0) {
                    isFull = false;
                    break;
                }
            }

            if (isFull) {
                // 꽉 찬 현재 줄(r) 삭제
                this.grid.splice(r, 1);
                // 맨 위에 빈 줄 추가하여 빈 공간 채움
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                
                // 줄이 한 칸씩 내려왔으므로 똑같은 인덱스(r)부터 다시 검사해야 함
                // (루프에서 자동으로 1이 줄어드니, 값을 다시 1 증가시켜 보정)
                r++;
            }
        }

        return linesCleared;
    }
}
