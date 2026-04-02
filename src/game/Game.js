import { Board } from './Board.js';
import { Piece } from './Piece.js';
import { Renderer } from './Renderer.js';
import {
  INITIAL_DROP_INTERVAL,
  LEVEL_SPEED_DECREASE,
  LINES_PER_LEVEL,
  MAX_LEVEL,
  MODES
} from '../utils/constants.js';

export class Game {
  constructor(canvas) {
    this.board = new Board();
    this.renderer = new Renderer(canvas);
    this.canvas = canvas;

    this.currentPiece = null;
    this.nextPiece = null;

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;

    this.level = 1;
    this.dropInterval = INITIAL_DROP_INTERVAL;
    this.lastDropTime = 0;

    this.mode = 'classic';
    this.speedMultiplier = 1;

    this.onScoreUpdate = null;
    this.onLevelUpdate = null;
    this.onLinesUpdate = null;
    this.onGameOver = null;
    this.onPauseToggle = null;

    this.pauseStartTime = 0;
    this.totalPauseTime = 0;
    this.gameStartTime = 0;
  }

  start() {
    if (this.isRunning && !this.isPaused) return;

    if (this.isPaused) {
      this.resume();
      return;
    }

    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameStartTime = performance.now();
    this.totalPauseTime = 0;

    this.spawnPiece();
    this.lastDropTime = performance.now();

    this.gameLoop();
  }

  reset() {
    this.board.reset();
    this.currentPiece = null;
    this.nextPiece = null;
    this.level = 1;
    this.dropInterval = INITIAL_DROP_INTERVAL;
    this.updateSpeed();
  }

  spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
      this.currentPiece.reset();
    } else {
      this.currentPiece = new Piece();
    }

    this.nextPiece = new Piece();

    if (!this.board.isValidPosition(this.currentPiece)) {
      this.endGame();
    }
  }

  gameLoop() {
    if (!this.isRunning || this.isGameOver) return;

    if (this.isPaused) {
      requestAnimationFrame(() => this.gameLoop());
      return;
    }

    const currentTime = performance.now();
    const adjustedInterval = this.dropInterval / this.speedMultiplier;

    if (currentTime - this.lastDropTime >= adjustedInterval) {
      this.drop();
      this.lastDropTime = currentTime;
    }

    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  drop() {
    if (!this.currentPiece || this.isPaused) return;

    const testPiece = this.createTestPiece();
    testPiece.move(0, 1);

    if (this.board.isValidPosition(testPiece)) {
      this.currentPiece.move(0, 1);
    } else {
      this.lockPiece();
    }
  }

  move(dx) {
    if (!this.currentPiece || this.isPaused || !this.isRunning) return false;

    const testPiece = this.createTestPiece();
    testPiece.move(dx, 0);

    if (this.board.isValidPosition(testPiece)) {
      this.currentPiece.move(dx, 0);
      return true;
    }

    return false;
  }

  rotate() {
    if (!this.currentPiece || this.isPaused || !this.isRunning) return false;

    const testPiece = this.createTestPiece();
    testPiece.rotate();

    if (this.board.isValidPosition(testPiece)) {
      this.currentPiece.rotate();
      return true;
    }

    testPiece.move(1, 0);
    if (this.board.isValidPosition(testPiece)) {
      this.currentPiece.rotate();
      this.currentPiece.move(1, 0);
      return true;
    }

    testPiece.move(-2, 0);
    if (this.board.isValidPosition(testPiece)) {
      this.currentPiece.rotate();
      this.currentPiece.move(-1, 0);
      return true;
    }

    return false;
  }

  hardDrop() {
    if (!this.currentPiece || this.isPaused || !this.isRunning) return;

    while (this.move(0)) {
      // keep moving down
    }

    this.lockPiece();
  }

  pause() {
    if (!this.isRunning || this.isGameOver) return;

    this.isPaused = true;
    this.pauseStartTime = performance.now();

    if (this.onPauseToggle) {
      this.onPauseToggle(true);
    }
  }

  resume() {
    if (!this.isPaused) return;

    this.totalPauseTime += performance.now() - this.pauseStartTime;
    this.isPaused = false;
    this.lastDropTime = performance.now();

    if (this.onPauseToggle) {
      this.onPauseToggle(false);
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  lockPiece() {
    if (!this.currentPiece) return;

    this.board.lockPiece(this.currentPiece);

    const linesCleared = this.board.clearLines();

    if (linesCleared > 0) {
      this.updateLevel();
    }

    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.board.score);
    }

    if (this.onLinesUpdate) {
      this.onLinesUpdate(this.board.lines);
    }

    this.spawnPiece();
  }

  updateLevel() {
    const newLevel = Math.min(
      Math.floor(this.board.lines / LINES_PER_LEVEL) + 1,
      MAX_LEVEL
    );

    if (newLevel !== this.level) {
      this.level = newLevel;
      this.updateSpeed();

      if (this.onLevelUpdate) {
        this.onLevelUpdate(this.level);
      }
    }
  }

  updateSpeed() {
    this.dropInterval = INITIAL_DROP_INTERVAL - (this.level - 1) * LEVEL_SPEED_DECREASE;
    this.dropInterval = Math.max(this.dropInterval, 100);
  }

  setMode(modeName) {
    if (MODES[modeName]) {
      this.mode = modeName;
      this.speedMultiplier = MODES[modeName].speedMultiplier;
    }
  }

  createTestPiece() {
    if (!this.currentPiece) return null;

    const testPiece = new Piece(this.currentPiece.type);
    testPiece.shape = this.currentPiece.shape.map(row => [...row]);
    testPiece.x = this.currentPiece.x;
    testPiece.y = this.currentPiece.y;
    return testPiece;
  }

  render() {
    if (!this.currentPiece) return;

    const ghostY = this.board.getGhostPosition(this.currentPiece);
    this.renderer.render(this.board, this.currentPiece, ghostY);

    if (this.isPaused) {
      this.renderer.drawPauseOverlay();
    }
  }

  endGame() {
    this.isRunning = false;
    this.isGameOver = true;

    if (this.onGameOver) {
      this.onGameOver({
        score: this.board.score,
        level: this.level,
        lines: this.board.lines,
        duration: this.getDuration()
      });
    }
  }

  getDuration() {
    if (!this.gameStartTime) return 0;

    const currentTime = this.isPaused ? this.pauseStartTime : performance.now();
    return currentTime - this.gameStartTime - this.totalPauseTime;
  }

  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      score: this.board.score,
      level: this.level,
      lines: this.board.lines,
      mode: this.mode
    };
  }
}
