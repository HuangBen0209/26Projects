import { Game } from './game/Game.js';
import { PoseDetector } from './pose/PoseDetector.js';
import { MotionMapper } from './pose/MotionMapper.js';
import { FitnessTracker } from './fitness/FitnessTracker.js';
import { UIManager } from './ui/UIManager.js';
import { CameraView } from './ui/CameraView.js';
import { MODES } from './utils/constants.js';

class FitBlockApp {
  constructor() {
    this.game = null;
    this.poseDetector = null;
    this.motionMapper = null;
    this.fitnessTracker = null;
    this.uiManager = null;
    this.cameraView = null;

    this.useMotionControl = false;
    this.selectedMode = 'classic';
    this.isPoseReady = false;

    this.poseLoopId = null;
    this.statsUpdateInterval = null;
    this.idleCheckInterval = null;

    this.init();
  }

  async init() {
    this.uiManager = new UIManager();
    this.cameraView = new CameraView();

    this.game = new Game(document.getElementById('game-canvas'));
    this.poseDetector = new PoseDetector();
    this.motionMapper = new MotionMapper();
    this.fitnessTracker = new FitnessTracker();

    this.setupGameCallbacks();
    this.setupUICallbacks();
    this.setupKeyboardControls();
    this.bindUIEvents();

    this.uiManager.showOverlay('欢迎来到 FitBlock', '选择体感控制开始，或使用键盘操作');

    await this.cameraView.init();
  }

  setupGameCallbacks() {
    this.game.onScoreUpdate = (score) => {
      this.uiManager.updateScore(score);
    };

    this.game.onLevelUpdate = (level) => {
      this.uiManager.updateLevel(level);
    };

    this.game.onLinesUpdate = (lines) => {
      this.uiManager.updateLines(lines);
    };

    this.game.onGameOver = (stats) => {
      this.stopPoseDetection();
      this.stopStatsUpdate();
      this.stopIdleCheck();

      const fitnessStats = this.fitnessTracker.getStats();

      this.uiManager.showGameOver({
        score: stats.score,
        level: stats.level,
        lines: stats.lines,
        duration: fitnessStats.durationFormatted,
        calories: fitnessStats.calories,
        totalActions: fitnessStats.totalActions
      });
    };

    this.game.onPauseToggle = (isPaused) => {
      if (isPaused) {
        this.uiManager.showOverlay('已暂停', '挥动双臂或按空格键继续');
      } else {
        this.uiManager.hideOverlay();
      }
    };
  }

  setupUICallbacks() {
    this.uiManager.bindModeSelection((mode) => {
      this.selectedMode = mode;
      this.game.setMode(mode);
      this.fitnessTracker.reset();
      this.updateModeThresholds();
    });

    this.uiManager.bindControlToggle((isMotion) => {
      this.useMotionControl = isMotion;
      this.uiManager.updateControlMode(isMotion);

      if (isMotion) {
        this.startPoseDetection();
      } else {
        this.stopPoseDetection();
      }
    });

    this.uiManager.bindSettingChanges((settings) => {
      this.motionMapper.updateThresholds(settings);
    });
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      if (!this.game.isRunning && e.key !== 'Enter' && e.key !== ' ') {
        return;
      }

      if (this.game.isGameOver) {
        if (e.key === 'Enter' || e.key === ' ') {
          this.restartGame();
        }
        return;
      }

      if (this.useMotionControl && this.game.isRunning) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          this.game.move(-1);
          break;
        case 'ArrowRight':
          this.game.move(1);
          break;
        case 'ArrowUp':
          this.game.rotate();
          break;
        case 'ArrowDown':
          this.game.drop();
          break;
        case ' ':
          e.preventDefault();
          if (this.game.isPaused) {
            this.game.resume();
            this.uiManager.hideOverlay();
          } else {
            this.game.pause();
          }
          break;
        case 'Enter':
          if (!this.game.isRunning) {
            this.startGame();
          }
          break;
      }
    });
  }

  bindUIEvents() {
    const elements = this.uiManager.elements;

    if (elements.btnStart) {
      elements.btnStart.addEventListener('click', () => {
        if (this.game.isPaused) {
          this.game.resume();
          this.uiManager.hideOverlay();
        } else if (!this.game.isRunning) {
          this.startGame();
        }
      });
    }

    if (elements.btnStartOverlay) {
      elements.btnStartOverlay.addEventListener('click', () => {
        this.startGame();
      });
    }

    if (elements.btnPause) {
      elements.btnPause.addEventListener('click', () => {
        this.game.togglePause();
      });
    }

    if (elements.btnRestart) {
      elements.btnRestart.addEventListener('click', () => {
        this.restartGame();
      });
    }

    if (elements.btnMode) {
      elements.btnMode.addEventListener('click', () => {
        this.uiManager.openModal('mode');
      });
    }

    if (elements.btnSettings) {
      elements.btnSettings.addEventListener('click', () => {
        this.uiManager.openModal('settings');
      });
    }

    if (elements.btnLeaderboard) {
      elements.btnLeaderboard.addEventListener('click', () => {
        this.uiManager.openModal('leaderboard');
      });
    }

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.uiManager.closeAllModals();
      });
    });

    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.uiManager.closeAllModals();
        }
      });
    });

    const playAgainBtn = document.getElementById('btn-play-again');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.uiManager.closeAllModals();
        this.restartGame();
      });
    }

    const cameraSelect = document.getElementById('camera-select');
    if (cameraSelect) {
      cameraSelect.addEventListener('change', async (e) => {
        if (e.target.value) {
          await this.cameraView.switchCamera(e.target.value);
          if (this.useMotionControl) {
            this.startPoseDetection();
          }
        }
      });
    }
  }

  async startGame() {
    if (!this.game.isRunning || this.game.isGameOver) {
      this.game.reset();
      this.game.setMode(this.selectedMode);
      this.fitnessTracker.start();

      this.uiManager.updateScore(0);
      this.uiManager.updateLevel(1);
      this.uiManager.updateLines(0);
      this.uiManager.updateFitnessStats({
        totalActions: 0,
        leftArmActions: 0,
        rightArmActions: 0,
        calories: 0,
        balance: 100,
        durationFormatted: '00:00'
      });
    }

    this.game.start();
    this.uiManager.hideOverlay();
    this.uiManager.setButtonStates(true, false);

    this.startStatsUpdate();
    this.startIdleCheck();

    if (this.useMotionControl) {
      await this.startPoseDetection();
    }
  }

  restartGame() {
    this.stopPoseDetection();
    this.stopStatsUpdate();
    this.stopIdleCheck();

    this.game.reset();
    this.game.setMode(this.selectedMode);
    this.fitnessTracker.start();

    this.game.start();
    this.uiManager.hideOverlay();
    this.uiManager.setButtonStates(true, false);

    this.startStatsUpdate();
    this.startIdleCheck();

    if (this.useMotionControl) {
      this.startPoseDetection();
    }
  }

  async startPoseDetection() {
    if (!this.isPoseReady) {
      const success = await this.poseDetector.init();
      if (!success) {
        console.error('Failed to initialize pose detector');
        return false;
      }
      this.isPoseReady = true;
    }

    if (!this.cameraView.isCameraActive()) {
      await this.cameraView.start();
    }

    this.motionMapper.reset();
    this.updateModeThresholds();

    this.poseDetector.onResults = (results) => {
      const landmarks = this.poseDetector.getLandmarks();
      this.cameraView.drawResults(landmarks, this.poseDetector);

      if (landmarks && this.game.isRunning && !this.game.isPaused) {
        const keyLandmarks = this.poseDetector.getKeyLandmarks();
        this.motionMapper.update(keyLandmarks);
        this.cameraView.updateAngleDisplay(this.motionMapper.getCurrentAngles());
      }
    };

    this.motionMapper.onMotionDetected = (action) => {
      this.handleMotionAction(action);
    };

    this.detectPoseLoop();
    return true;
  }

  async detectPoseLoop() {
    if (!this.useMotionControl || !this.game.isRunning) {
      this.poseLoopId = null;
      return;
    }

    const video = this.cameraView.getVideoElement();
    if (video && video.readyState >= 2) {
      await this.poseDetector.detect(video);
    }

    this.poseLoopId = requestAnimationFrame(() => this.detectPoseLoop());
  }

  stopPoseDetection() {
    if (this.poseLoopId) {
      cancelAnimationFrame(this.poseLoopId);
      this.poseLoopId = null;
    }
    this.motionMapper.reset();
  }

  handleMotionAction(action) {
    if (!this.game.isRunning || this.game.isPaused) {
      if (action === 'pause') {
        this.game.resume();
        this.uiManager.hideOverlay();
      }
      return;
    }

    let recorded = false;

    switch (action) {
      case 'leftSwipe':
        if (this.game.move(-1)) {
          this.fitnessTracker.recordAction('leftSwipe', 'left');
          recorded = true;
        }
        break;
      case 'rightSwipe':
        if (this.game.move(1)) {
          this.fitnessTracker.recordAction('rightSwipe', 'right');
          recorded = true;
        }
        break;
      case 'rotate':
        if (this.game.rotate()) {
          this.fitnessTracker.recordAction('rotate', 'both');
          recorded = true;
        }
        break;
      case 'quickDrop':
        this.fitnessTracker.recordAction('quickDrop', 'both');
        this.game.hardDrop();
        recorded = true;
        break;
      case 'push':
        this.fitnessTracker.recordAction('push', 'both');
        recorded = true;
        break;
      case 'pause':
        this.game.togglePause();
        break;
    }

    if (recorded) {
      this.updateFitnessDisplay();
    }
  }

  updateModeThresholds() {
    if (MODES[this.selectedMode]) {
      this.motionMapper.setThresholds(MODES[this.selectedMode].armThresholdMultiplier);
    }
  }

  startStatsUpdate() {
    this.statsUpdateInterval = setInterval(() => {
      this.updateFitnessDisplay();
    }, 1000);
  }

  stopStatsUpdate() {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }
  }

  startIdleCheck() {
    this.idleCheckInterval = setInterval(() => {
      this.fitnessTracker.updateIdleTime();

      if (this.fitnessTracker.isIdle() && this.game.isRunning && !this.game.isPaused) {
        this.game.dropInterval = Math.max(100, this.game.dropInterval * 0.5);
      }
    }, 1000);
  }

  stopIdleCheck() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  updateFitnessDisplay() {
    const stats = this.fitnessTracker.getStats();
    this.uiManager.updateFitnessStats(stats);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.fitblockApp = new FitBlockApp();
});
