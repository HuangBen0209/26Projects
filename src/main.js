import { Game } from './game/Game.js';
import { PoseDetector } from './pose/PoseDetector.js';
import { MotionMapper } from './pose/MotionMapper.js';
import { FitnessTracker } from './fitness/FitnessTracker.js';
import { UIManager } from './ui/UIManager.js';
import { CameraView } from './ui/CameraView.js';
import { MODES, IDLE_THRESHOLD, IDLE_SPEED_INCREASE } from './utils/constants.js';

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
    this.isPoseInitializing = false;

    this.showFps = true;
    this.statsUpdateInterval = null;
    this.idleCheckInterval = null;

    this.isCalibrating = false;
    this.calibrationProgress = 0;

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
          this.showGameActionFeedback('leftSwipe');
          break;
        case 'ArrowRight':
          this.game.move(1);
          this.showGameActionFeedback('rightSwipe');
          break;
        case 'ArrowUp':
          this.game.rotate();
          this.showGameActionFeedback('rotate');
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
        case 'c':
        case 'C':
          if (this.useMotionControl && this.game.isRunning && !this.isCalibrating) {
            this.startCalibration();
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
            await this.startPoseDetection();
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
    if (this.isPoseInitializing) {
      return false;
    }

    this.isPoseInitializing = true;

    try {
      this.showMediaPipeLoading(true);
      this.updateCameraStatus('加载姿态识别...');

      if (!this.isPoseReady) {
        const success = await this.poseDetector.init();
        if (!success) {
          console.error('Failed to initialize pose detector');
          this.updateCameraStatus('姿态识别加载失败');
          this.showMediaPipeLoading(false);
          return false;
        }
        this.isPoseReady = true;
      }

      this.updateCameraStatus('启动摄像头...');

      const video = this.cameraView.getVideoElement();
      if (!video) {
        console.error('Video element not found');
        this.updateCameraStatus('摄像头未找到');
        this.showMediaPipeLoading(false);
        return false;
      }

      const started = await this.cameraView.start();
      if (!started) {
        console.error('Failed to start camera');
        this.updateCameraStatus('摄像头启动失败');
        this.showMediaPipeLoading(false);
        return false;
      }

      this.motionMapper.reset();
      this.updateModeThresholds();

      this.poseDetector.onResults = (results) => {
        const landmarks = this.poseDetector.getLandmarks();
        this.cameraView.drawResults(landmarks, this.poseDetector);

        if (this.isCalibrating && landmarks) {
          this.processCalibration(landmarks);
        }

        if (landmarks && this.game.isRunning && !this.game.isPaused) {
          const keyLandmarks = this.poseDetector.getKeyLandmarks();
          this.motionMapper.update(keyLandmarks);
          this.cameraView.updateAngleDisplay(this.motionMapper.getCurrentAngles());
        }
      };

      this.motionMapper.onMotionDetected = (action) => {
        this.handleMotionAction(action);
      };

      await this.poseDetector.startCamera(video);
      this.showMediaPipeLoading(false);
      this.updateCameraStatus('准备就绪');
      this.isPoseInitializing = false;
      return true;
    } catch (error) {
      console.error('Pose detection error:', error);
      this.updateCameraStatus('姿态识别错误');
      this.showMediaPipeLoading(false);
      this.isPoseInitializing = false;
      return false;
    }
  }

  stopPoseDetection() {
    if (this.poseDetector) {
      this.poseDetector.stopCamera();
    }
    if (this.motionMapper) {
      this.motionMapper.reset();
    }
    this.isCalibrating = false;
  }

  startCalibration() {
    if (!this.useMotionControl || !this.game.isRunning) return;

    this.isCalibrating = true;
    this.calibrationProgress = 0;
    this.showMediaPipeLoading(true);

    const calibrationDuration = 3000;
    const startTime = Date.now();

    const updateCalibration = () => {
      if (!this.isCalibrating) return;

      const elapsed = Date.now() - startTime;
      this.calibrationProgress = Math.min(elapsed / calibrationDuration, 1);

      if (elapsed >= calibrationDuration) {
        const landmarks = this.poseDetector.getKeyLandmarks();
        if (landmarks) {
          this.motionMapper.calibrate(landmarks);
          this.isCalibrating = false;
          this.showMediaPipeLoading(false);
          this.updateCameraStatus('校准完成');
          this.playSound('success');
          return;
        }
      }

      requestAnimationFrame(updateCalibration);
    };

    updateCalibration();
  }

  processCalibration(landmarks) {
    // Progressive calibration - update in real-time
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
          this.showGameActionFeedback('leftSwipe');
        }
        break;
      case 'rightSwipe':
        if (this.game.move(1)) {
          this.fitnessTracker.recordAction('rightSwipe', 'right');
          recorded = true;
          this.showGameActionFeedback('rightSwipe');
        }
        break;
      case 'rotate':
        if (this.game.rotate()) {
          this.fitnessTracker.recordAction('rotate', 'both');
          recorded = true;
          this.showGameActionFeedback('rotate');
        }
        break;
      case 'quickDrop':
        this.fitnessTracker.recordAction('quickDrop', 'both');
        this.game.hardDrop();
        recorded = true;
        this.showGameActionFeedback('quickDrop');
        break;
      case 'push':
        this.fitnessTracker.recordAction('push', 'both');
        recorded = true;
        this.showGameActionFeedback('push');
        break;
      case 'pause':
        this.game.togglePause();
        break;
    }

    if (recorded) {
      this.playSound('action');
      this.updateFitnessDisplay();
    }
  }

  showGameActionFeedback(action) {
    this.game.renderer.showActionFeedback(action);
  }

  playSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'action') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.type = 'sine';
      } else if (type === 'success') {
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.15;
        oscillator.type = 'sine';
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
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
      this.updateGameRender();
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
        const currentInterval = this.game.dropInterval;
        this.game.dropInterval = Math.max(100, currentInterval * (1 - IDLE_SPEED_INCREASE));
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

  updateGameRender() {
    if (this.game.isRunning && !this.game.isPaused) {
      this.game.render();
      this.game.renderer.drawNextPiece(this.game.nextPiece);
    }
  }

  showMediaPipeLoading(show) {
    const loadingEl = document.getElementById('mediapipe-loading');
    if (loadingEl) {
      loadingEl.style.display = show ? 'flex' : 'none';
    }
  }

  updateCameraStatus(status) {
    const statusEl = document.getElementById('camera-status');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.fitblockApp = new FitBlockApp();
});
