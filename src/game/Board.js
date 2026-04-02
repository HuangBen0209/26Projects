import { BOARD_WIDTH, BOARD_HEIGHT, SCORE_TABLE, COMBO_BONUS } from '../utils/constants.js';

export class Board {
  constructor() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.lines = 0;
    this.combo = 0;
  }

  createEmptyGrid() {
    return Array.from({ length: BOARD_HEIGHT }, () =>
      Array(BOARD_WIDTH).fill(null)
    );
  }

  isValidPosition(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }

          if (newY >= 0 && this.grid[newY][newX] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  lockPiece(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;

          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            this.grid[boardY][boardX] = piece.color;
          }
        }
      }
    }
  }

  clearLines() {
    let linesCleared = 0;
    const linesToRemove = [];

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== null)) {
        linesToRemove.push(y);
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      for (const lineY of linesToRemove) {
        this.grid.splice(lineY, 1);
        this.grid.unshift(Array(BOARD_WIDTH).fill(null));
      }

      const baseScore = SCORE_TABLE[linesCleared] || 0;
      const comboBonus = this.combo * COMBO_BONUS;
      this.score += baseScore + comboBonus;
      this.lines += linesCleared;
      this.combo++;
    } else {
      this.combo = 0;
    }

    return linesCleared;
  }

  isGameOver() {
    return this.grid[0].some(cell => cell !== null);
  }

  reset() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.lines = 0;
    this.combo = 0;
  }

  getGhostPosition(piece) {
    let ghostY = piece.y;

    while (this.isValidPositionWithGhost(piece, piece.x, ghostY + 1)) {
      ghostY++;
    }

    return ghostY;
  }

  isValidPositionWithGhost(piece, x, y) {
    for (let py = 0; py < piece.shape.length; py++) {
      for (let px = 0; px < piece.shape[py].length; px++) {
        if (piece.shape[py][px]) {
          const newX = x + px;
          const newY = y + py;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }

          if (newY >= 0 && this.grid[newY][newX] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }
}
