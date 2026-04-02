export class UIManager {
  constructor() {
    this.elements = {};
    this.modals = {};
    this.cacheElements();
  }

  cacheElements() {
    this.elements = {
      level: document.getElementById('level'),
      score: document.getElementById('score'),
      lines: document.getElementById('lines'),
      totalActions: document.getElementById('total-actions'),
      leftActions: document.getElementById('left-actions'),
      rightActions: document.getElementById('right-actions'),
      calories: document.getElementById('calories'),
      balance: document.getElementById('balance'),
      duration: document.getElementById('duration'),
      gameOverlay: document.getElementById('game-overlay'),
      controlMode: document.getElementById('control-mode'),
      controlToggle: document.getElementById('control-toggle'),
      btnStart: document.getElementById('btn-start'),
      btnPause: document.getElementById('btn-pause'),
      btnRestart: document.getElementById('btn-restart'),
      btnMode: document.getElementById('btn-mode'),
      btnSettings: document.getElementById('btn-settings'),
      btnLeaderboard: document.getElementById('btn-leaderboard'),
      btnStartOverlay: document.getElementById('btn-start-overlay')
    };

    this.modals = {
      mode: document.getElementById('mode-modal'),
      settings: document.getElementById('settings-modal'),
      leaderboard: document.getElementById('leaderboard-modal'),
      gameover: document.getElementById('gameover-modal')
    };
  }

  updateScore(score) {
    if (this.elements.score) {
      this.elements.score.textContent = score;
    }
  }

  updateLevel(level) {
    if (this.elements.level) {
      this.elements.level.textContent = level;
    }
  }

  updateLines(lines) {
    if (this.elements.lines) {
      this.elements.lines.textContent = lines;
    }
  }

  updateFitnessStats(stats) {
    if (this.elements.totalActions) {
      this.elements.totalActions.textContent = stats.totalActions;
    }
    if (this.elements.leftActions) {
      this.elements.leftActions.textContent = stats.leftArmActions;
    }
    if (this.elements.rightActions) {
      this.elements.rightActions.textContent = stats.rightArmActions;
    }
    if (this.elements.calories) {
      this.elements.calories.innerHTML = `${stats.calories} <small>千卡</small>`;
    }
    if (this.elements.balance) {
      this.elements.balance.textContent = `${stats.balance}%`;
    }
    if (this.elements.duration) {
      this.elements.duration.textContent = stats.durationFormatted;
    }
  }

  updateDuration(formatted) {
    if (this.elements.duration) {
      this.elements.duration.textContent = formatted;
    }
  }

  showOverlay(title, desc) {
    if (this.elements.gameOverlay) {
      this.elements.gameOverlay.style.display = 'flex';
      const titleEl = this.elements.gameOverlay.querySelector('.overlay-title');
      const descEl = this.elements.gameOverlay.querySelector('.overlay-desc');
      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;
    }
  }

  hideOverlay() {
    if (this.elements.gameOverlay) {
      this.elements.gameOverlay.style.display = 'none';
    }
  }

  updateControlMode(isMotion) {
    if (this.elements.controlMode) {
      this.elements.controlMode.textContent = isMotion ? '体感' : '键盘';
    }
    if (this.elements.controlToggle) {
      this.elements.controlToggle.checked = isMotion;
    }
  }

  openModal(modalName) {
    if (this.modals[modalName]) {
      this.modals[modalName].classList.add('active');
    }
  }

  closeModal(modalName) {
    if (this.modals[modalName]) {
      this.modals[modalName].classList.remove('active');
    }
  }

  closeAllModals() {
    Object.values(this.modals).forEach(modal => {
      modal.classList.remove('active');
    });
  }

  showGameOver(stats) {
    const finalScore = document.getElementById('final-score');
    const finalDuration = document.getElementById('final-duration');
    const finalCalories = document.getElementById('final-calories');
    const finalActions = document.getElementById('final-actions');

    if (finalScore) finalScore.textContent = stats.score;
    if (finalDuration) finalDuration.textContent = stats.duration;
    if (finalCalories) finalCalories.textContent = `${stats.calories} 千卡`;
    if (finalActions) finalActions.textContent = stats.totalActions;

    this.openModal('gameover');
  }

  setButtonStates(isRunning, isPaused) {
    if (this.elements.btnStart) {
      if (isRunning && !isPaused) {
        this.elements.btnStart.textContent = '继续';
      } else {
        this.elements.btnStart.textContent = '开始';
      }
    }

    if (this.elements.btnPause) {
      this.elements.btnPause.textContent = isPaused ? '继续' : '暂停';
      this.elements.btnPause.disabled = !isRunning;
    }
  }

  bindModeSelection(callback) {
    const modeOptions = document.querySelectorAll('.mode-option');
    modeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const mode = option.dataset.mode;
        callback(mode);
        this.closeModal('mode');
      });
    });
  }

  bindSettingChanges(callback) {
    const armAngleInput = document.getElementById('setting-arm-angle');
    const liftAngleInput = document.getElementById('setting-lift-angle');
    const pushAngleInput = document.getElementById('setting-push-angle');

    if (armAngleInput) {
      armAngleInput.addEventListener('input', (e) => {
        document.getElementById('setting-arm-angle-value').textContent = `${e.target.value}°`;
        callback({ armAngle: parseInt(e.target.value) });
      });
    }

    if (liftAngleInput) {
      liftAngleInput.addEventListener('input', (e) => {
        document.getElementById('setting-lift-angle-value').textContent = `${e.target.value}°`;
        callback({ liftAngle: parseInt(e.target.value) });
      });
    }

    if (pushAngleInput) {
      pushAngleInput.addEventListener('input', (e) => {
        document.getElementById('setting-push-angle-value').textContent = `${e.target.value}°`;
        callback({ pushAngle: parseInt(e.target.value) });
      });
    }
  }

  bindControlToggle(callback) {
    if (this.elements.controlToggle) {
      this.elements.controlToggle.addEventListener('change', (e) => {
        callback(e.target.checked);
      });
    }
  }
}
