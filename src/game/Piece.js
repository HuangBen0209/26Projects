import { PIECES } from '../utils/constants.js';

export class Piece {
  constructor(type = null) {
    this.type = type || this.randomType();
    this.pieceData = PIECES[this.type];
    this.shape = this.pieceData.shape.map(row => [...row]);
    this.color = this.pieceData.color;
    this.x = Math.floor((10 - this.shape[0].length) / 2);
    this.y = 0;
  }

  randomType() {
    const types = Object.keys(PIECES);
    return types[Math.floor(Math.random() * types.length)];
  }

  rotate() {
    const rows = this.shape.length;
    const cols = this.shape[0].length;
    const rotated = [];

    for (let col = 0; col < cols; col++) {
      const newRow = [];
      for (let row = rows - 1; row >= 0; row--) {
        newRow.push(this.shape[row][col]);
      }
      rotated.push(newRow);
    }

    this.shape = rotated;
  }

  rotateBack() {
    const rows = this.shape.length;
    const cols = this.shape[0].length;
    const rotated = [];

    for (let col = cols - 1; col >= 0; col--) {
      const newRow = [];
      for (let row = 0; row < rows; row++) {
        newRow.push(this.shape[row][col]);
      }
      rotated.push(newRow);
    }

    this.shape = rotated;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  reset() {
    this.shape = this.pieceData.shape.map(row => [...row]);
    this.x = Math.floor((10 - this.shape[0].length) / 2);
    this.y = 0;
  }
}
