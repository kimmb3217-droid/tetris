// tetromino.js
// 7가지 테트로미노의 고유 색상(CSS 변수 색상 고려)과 형태를 정의합니다.

const COLORS = {
    I: '#00eeee', // Cyan
    J: '#1e90ff', // Blue
    L: '#ff8c00', // Orange
    O: '#ffd700', // Yellow
    S: '#32cd32', // Green
    T: '#9370db', // Purple
    Z: '#ff4500'  // Red
};

const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

class Tetromino {
    constructor(type) {
        this.type = type;
        this.color = COLORS[type];
        this.shape = SHAPES[type];
        // 처음 등장 위치: 위쪽 중앙 
        this.x = type === 'O' ? 4 : 3;
        this.y = 0;
    }

    // 시계 방향 회전 (새로운 형태의 매트릭스 반환)
    getRotatedShape() {
        // N x N 정사각형 매트릭스 전치(Transpose) 후 각 행을 뒤집음(Reverse)
        const N = this.shape.length;
        const result = [];
        for (let i = 0; i < N; i++) {
            result.push(new Array(N).fill(0));
        }

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                result[c][N - 1 - r] = this.shape[r][c];
            }
        }
        return result;
    }

    rotate() {
        this.shape = this.getRotatedShape();
    }
}
