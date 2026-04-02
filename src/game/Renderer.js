import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, NEXT_PIECE_SIZE, COLORS } from '../utils/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = BOARD_WIDTH * CELL_SIZE;
    this.canvas.height = BOARD_HEIGHT * CELL_SIZE;

    this.fps = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateTime = 0;

    this.actionFeedback = null;
    this.actionFeedbackTime = 0;
  }

  clear() {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid() {
    this.ctx.strokeStyle = COLORS.grid;
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= BOARD_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * CELL_SIZE, 0);
      this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * CELL_SIZE);
      this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
      this.ctx.stroke();
    }
  }

  drawCell(x, y, color, isGhost = false) {
    const cellX = x * CELL_SIZE;
    const cellY = y * CELL_SIZE;

    if (isGhost) {
      this.ctx.fillStyle = COLORS.ghost;
    } else {
      this.ctx.fillStyle = color;
    }

    this.ctx.fillRect(cellX + 1, cellY + 1, CELL_SIZE - 2, CELL_SIZE - 2);

    if (!isGhost) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(cellX + 1, cellY + 1, CELL_SIZE - 2, 4);
      this.ctx.fillRect(cellX + 1, cellY + 1, 4, CELL_SIZE - 2);

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(cellX + CELL_SIZE - 5, cellY + 5, 4, CELL_SIZE - 6);
      this.ctx.fillRect(cellX + 5, cellY + CELL_SIZE - 5, CELL_SIZE - 6, 4);
    }
  }

  drawBoard(board) {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board.grid[y][x]) {
          this.drawCell(x, y, board.grid[y][x]);
        }
      }
    }
  }

  drawPiece(piece, ghostY = null) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          if (ghostY !== null && ghostY !== piece.y) {
            const displayY = ghostY + y;
            if (displayY >= 0) {
              this.drawCell(piece.x + x, displayY, piece.color, true);
            }
          }

          const displayY = piece.y + y;
          if (displayY >= 0) {
            this.drawCell(piece.x + x, displayY, piece.color);
          }
        }
      }
    }
  }

  drawNextPiece(piece) {
    if (!piece) return;

    const previewCanvas = document.getElementById('next-piece-canvas');
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    const size = NEXT_PIECE_SIZE;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const pieceWidth = piece.shape[0].length * size;
    const pieceHeight = piece.shape.length * size;
    const offsetX = (previewCanvas.width - pieceWidth) / 2;
    const offsetY = (previewCanvas.height - pieceHeight) / 2;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const cellX = offsetX + x * size;
          const cellY = offsetY + y * size;

          ctx.fillStyle = piece.color;
          ctx.fillRect(cellX + 1, cellY + 1, size - 2, size - 2);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(cellX + 1, cellY + 1, size - 2, 3);
          ctx.fillRect(cellX + 1, cellY + 1, 3, size - 2);
        }
      }
    }
  }

  drawActionFeedback(action) {
    if (!this.actionFeedback) return;

    const now = performance.now();
    const elapsed = now - this.actionFeedbackTime;

    if (elapsed > 300) {
      this.actionFeedback = null;
      return;
    }

    const alpha = 1 - (elapsed / 300);
    this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
    this.ctx.font = 'bold 16px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let text = '';
    switch (action) {
      case 'leftSwipe': text = '←'; break;
      case 'rightSwipe': text = '→'; break;
      case 'rotate': text = '↻'; break;
      case 'quickDrop': text = '↓↓'; break;
      case 'push': text = '⏸'; break;
    }

    if (text) {
      this.ctx.fillText(text, this.canvas.width / 2, 30);
    }
  }

  showActionFeedback(action) {
    this.actionFeedback = action;
    this.actionFeedbackTime = performance.now();
  }

  updateFPS() {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.fpsUpdateTime;

    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    return this.fps;
  }

  drawFPS() {
    const fps = this.updateFPS();
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(5, 5, 50, 20);
    
    this.ctx.fillStyle = fps >= 50 ? '#10B981' : fps >= 30 ? '#F59E0B' : '#EF4444';
    this.ctx.font = '12px JetBrains Mono';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`${fps} FPS`, 10, 8);
  }

  render(board, piece, ghostY, showFps = false) {
    this.clear();
    this.drawGrid();
    this.drawBoard(board);
    this.drawPiece(piece, ghostY);
    this.drawActionFeedback();
    
    if (showFps) {
      this.drawFPS();
    }
  }

  drawPauseOverlay() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#F8FAFC';
    this.ctx.font = 'bold 24px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('已暂停', this.canvas.width / 2, this.canvas.height / 2 - 20);

    this.ctx.font = '14px Inter';
    this.ctx.fillText('挥动双臂继续', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }

  drawLineClearEffect(lineY) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(0, lineY * CELL_SIZE, this.canvas.width, CELL_SIZE);
  }
}
