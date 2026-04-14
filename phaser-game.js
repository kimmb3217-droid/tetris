// phaser-game.js
// Phaser 3 Engine for Neon Tetrix

const BLOCK_SIZE = 32; // This will be calculated dynamically to fit the container
const PADDING = 2;

class TetrisScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TetrisScene' });
    }

    init() {
        this.board = null;
        this.currentPiece = null;
        this.ghostPiece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        
        this.gridGraphics = null;
        this.blockGraphics = null;
        this.ghostGraphics = null;
    }

    create() {
        this.gridGraphics = this.add.graphics();
        this.ghostGraphics = this.add.graphics();
        this.blockGraphics = this.add.graphics();
        
        // Test rectangle to verify rendering
        const test = this.add.graphics();
        test.fillStyle(0xff0000, 0.5);
        test.fillRect(0, 0, 100, 100);
        
        // Listen for events from game.js
        this.events.on('update-board', this.updateBoard, this);
        this.events.on('update-pieces', this.updatePieces, this);
        this.events.on('clear-all', this.clearAll, this);
    }

    // Phaser doesn't need a heavy update loop since we drive it from game.js for now
    // But we can use it for animations later.
    update() {
        this.render();
    }

    updateBoard(grid) {
        this.boardGrid = grid;
    }

    updatePieces(data) {
        this.currentPiece = data.currentPiece;
        this.ghostPiece = data.ghostPiece;
        this.nextPiece = data.nextPiece;
        this.heldPiece = data.heldPiece;
    }

    clearAll() {
        this.boardGrid = null;
        this.currentPiece = null;
        this.ghostPiece = null;
    }

    render() {
        this.blockGraphics.clear();
        this.ghostGraphics.clear();
        this.gridGraphics.clear();

        const { width, height } = this.scale;
        const cellSize = width / 10;

        // 1. Draw Board Grid (Faint)
        this.gridGraphics.lineStyle(1, 0x000000, 0.05);
        for (let x = 0; x <= 10; x++) {
            this.gridGraphics.moveTo(x * cellSize, 0);
            this.gridGraphics.lineTo(x * cellSize, height);
        }
        for (let y = 0; y <= 20; y++) {
            this.gridGraphics.moveTo(0, y * cellSize);
            this.gridGraphics.lineTo(width, y * cellSize);
        }
        this.gridGraphics.strokePath();

        // 2. Draw Stacked Blocks
        if (this.boardGrid) {
            for (let r = 0; r < 20; r++) {
                for (let c = 0; c < 10; c++) {
                    const colorStr = this.boardGrid[r][c];
                    if (colorStr !== 0) {
                        this.drawBlock(c, r, colorStr, this.blockGraphics, cellSize);
                    }
                }
            }
        }

        // 3. Draw Ghost Piece
        if (this.ghostPiece) {
            this.drawPiece(this.ghostPiece, this.ghostGraphics, cellSize, true);
        }

        // 4. Draw Current Piece
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.blockGraphics, cellSize);
        }
    }

    drawPiece(piece, graphics, cellSize, isGhost = false) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] !== 0) {
                    this.drawBlock(piece.x + c, piece.y + r, piece.color, graphics, cellSize, isGhost);
                }
            }
        }
    }

    drawBlock(x, y, type, graphics, cellSize, isGhost = false) {
        const color = this.getHexColor(type);
        const pad = cellSize * 0.05;
        const rectSize = cellSize - (pad * 2);
        const radius = cellSize * 0.15;

        if (isGhost) {
            graphics.lineStyle(2, color, 0.6);
            graphics.strokeRoundedRect(x * cellSize + pad, y * cellSize + pad, rectSize, rectSize, radius);
            graphics.fillStyle(0x000000, 0.05);
            graphics.fillRoundedRect(x * cellSize + pad, y * cellSize + pad, rectSize, rectSize, radius);
        } else {
            // Main block body
            graphics.fillStyle(color, 1);
            graphics.fillRoundedRect(x * cellSize + pad, y * cellSize + pad, rectSize, rectSize, radius);
            
            // Subtle top highlight for 3D look
            graphics.lineStyle(2, 0xffffff, 0.3);
            graphics.strokeRoundedRect(x * cellSize + pad, y * cellSize + pad, rectSize, rectSize, radius);
            
            // Shadow (inner)
            graphics.lineStyle(1, 0x000000, 0.1);
            graphics.strokeRoundedRect(x * cellSize + pad + 1, y * cellSize + pad + 1, rectSize - 2, rectSize - 2, radius);
        }
    }

    getHexColor(type) {
        const colors = {
            I: 0x4DD0E1, J: 0x64B5F6, L: 0xFFB74D, O: 0xFFF176, S: 0x81C784, T: 0xBA68C8, Z: 0xE57373
        };
        // O: 0FFF176 is missing x. 0xFFF176
        if (type === 'O') return 0xFFF176;
        return colors[type] || 0xffffff;
    }
}

// Configuration for Main Board
const config = {
    type: Phaser.AUTO,
    parent: 'game-board',
    width: 320,
    height: 640,
    backgroundColor: '#000000', // Black background for debugging
    scale: {
        mode: Phaser.Scale.FIT
    },
    scene: [TetrisScene]
};

// Next Piece Micro-Canvas Config
const nextConfig = {
    type: Phaser.AUTO,
    parent: 'next-piece-grid',
    width: 64,
    height: 64,
    transparent: true,
    scene: class extends Phaser.Scene {
        create() { 
            this.graphics = this.add.graphics();
            this.events.on('update-next', (piece) => {
                this.graphics.clear();
                if (!piece) return;
                const cellSize = 16;
                const startX = (64 - piece.shape[0].length * cellSize) / 2;
                const startY = (64 - piece.shape.length * cellSize) / 2;
                this.renderSmallPiece(piece, startX, startY, cellSize);
            });
        }
        renderSmallPiece(piece, offsetX, offsetY, cellSize) {
            const color = this.getHexColor(piece.color);
            this.graphics.fillStyle(color, 1);
            for (let r = 0; r < piece.shape.length; r++) {
                for (let c = 0; c < piece.shape[r].length; c++) {
                    if (piece.shape[r][c] !== 0) {
                        this.graphics.fillRoundedRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize - 1, cellSize - 1, 3);
                    }
                }
            }
        }
        getHexColor(type) {
            const colors = { I: 0x4DD0E1, J: 0x64B5F6, L: 0xFFB74D, O: 0xFFF176, S: 0x81C784, T: 0xBA68C8, Z: 0xE57373 };
            return colors[type] || 0xffffff;
        }
    }
};

// Held Piece Micro-Canvas Config
const heldConfig = {
    type: Phaser.AUTO,
    parent: 'held-piece-grid',
    width: 64,
    height: 64,
    transparent: true,
    scene: class extends Phaser.Scene {
        create() {
            this.graphics = this.add.graphics();
            this.events.on('update-held', (piece) => {
                this.graphics.clear();
                if (!piece) return;
                const cellSize = 16;
                const startX = (64 - piece.shape[0].length * cellSize) / 2;
                const startY = (64 - piece.shape.length * cellSize) / 2;
                this.renderSmallPiece(piece, startX, startY, cellSize);
            });
        }
        renderSmallPiece(piece, offsetX, offsetY, cellSize) {
            const color = this.getHexColor(piece.color);
            this.graphics.fillStyle(color, 1);
            for (let r = 0; r < piece.shape.length; r++) {
                for (let c = 0; c < piece.shape[r].length; c++) {
                    if (piece.shape[r][c] !== 0) {
                        this.graphics.fillRoundedRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize - 1, cellSize - 1, 3);
                    }
                }
            }
        }
        getHexColor(type) {
            const colors = { I: 0x4DD0E1, J: 0x64B5F6, L: 0xFFB74D, O: 0xFFF176, S: 0x81C784, T: 0xBA68C8, Z: 0xE57373 };
            return colors[type] || 0xffffff;
        }
    }
};

let phaserGame, phaserNext, phaserHeld;
window.initPhaser = () => {
    if (phaserGame) return;
    phaserGame = new Phaser.Game(config);
    phaserNext = new Phaser.Game(nextConfig);
    phaserHeld = new Phaser.Game(heldConfig);
};

window.updatePhaserGame = (board, currentPiece, ghostPiece) => {
    if (!phaserGame) return;
    const scene = phaserGame.scene.getScene('TetrisScene');
    if (scene) {
        scene.updateBoard(board.grid);
        scene.updatePieces({ currentPiece, ghostPiece });
    }
};

window.updatePhaserNext = (piece) => {
    if (!phaserNext) return;
    const scene = phaserNext.scene.scenes[0];
    if (scene) scene.events.emit('update-next', piece);
};

window.updatePhaserHeld = (piece) => {
    if (!phaserHeld) return;
    const scene = phaserHeld.scene.scenes[0];
    if (scene) scene.events.emit('update-held', piece);
};

window.clearPhaser = () => {
    if (phaserGame) {
        const scene = phaserGame.scene.getScene('TetrisScene');
        if (scene) scene.clearAll();
    }
};
