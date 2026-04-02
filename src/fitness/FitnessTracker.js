import { CALORIE_COSTS } from '../utils/constants.js';

export class FitnessTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.leftArmActions = 0;
    this.rightArmActions = 0;
    this.totalActions = 0;

    this.calories = 0;

    this.actionHistory = [];

    this.startTime = null;
    this.endTime = null;

    this.lastActionTime = null;
    this.idleTime = 0;
    this.idleThreshold = 5000;
  }

  start() {
    this.reset();
    this.startTime = Date.now();
    this.lastActionTime = Date.now();
  }

  stop() {
    this.endTime = Date.now();
  }

  recordAction(actionType, arm = 'both') {
    const now = Date.now();

    this.lastActionTime = now;
    this.idleTime = 0;

    let calorieCost = 0;

    switch (actionType) {
      case 'leftSwipe':
        this.leftArmActions++;
        calorieCost = CALORIE_COSTS.SWIPE;
        break;
      case 'rightSwipe':
        this.rightArmActions++;
        calorieCost = CALORIE_COSTS.SWIPE;
        break;
      case 'rotate':
        this.leftArmActions++;
        this.rightArmActions++;
        calorieCost = CALORIE_COSTS.ROTATE;
        break;
      case 'quickDrop':
        this.leftArmActions++;
        this.rightArmActions++;
        calorieCost = CALORIE_COSTS.QUICK_DROP;
        break;
      case 'push':
        calorieCost = CALORIE_COSTS.PUSH;
        break;
      default:
        calorieCost = 0;
    }

    this.totalActions++;
    this.calories += calorieCost;

    this.actionHistory.push({
      type: actionType,
      arm: arm,
      calorieCost: calorieCost,
      timestamp: now
    });
  }

  updateIdleTime() {
    if (this.startTime && !this.endTime) {
      const now = Date.now();
      if (this.lastActionTime) {
        this.idleTime = now - this.lastActionTime;
      }
    }
  }

  isIdle() {
    return this.idleTime >= this.idleThreshold;
  }

  getBalance() {
    const total = this.leftArmActions + this.rightArmActions;
    if (total === 0) return 100;

    const diff = Math.abs(this.leftArmActions - this.rightArmActions);
    const balance = 100 - (diff / total * 100);

    return Math.round(balance);
  }

  getDuration() {
    if (!this.startTime) return 0;

    const end = this.endTime || Date.now();
    return end - this.startTime;
  }

  getDurationFormatted() {
    const duration = this.getDuration();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getStats() {
    return {
      totalActions: this.totalActions,
      leftArmActions: this.leftArmActions,
      rightArmActions: this.rightArmActions,
      calories: Math.round(this.calories * 10) / 10,
      balance: this.getBalance(),
      duration: this.getDuration(),
      durationFormatted: this.getDurationFormatted(),
      isIdle: this.isIdle(),
      idleTime: this.idleTime
    };
  }

  getReport() {
    return {
      score: 0,
      duration: this.getDurationFormatted(),
      durationMs: this.getDuration(),
      calories: Math.round(this.calories * 10) / 10,
      totalActions: this.totalActions,
      leftArmActions: this.leftArmActions,
      rightArmActions: this.rightArmActions,
      balance: this.getBalance(),
      actionHistory: this.actionHistory,
      timestamp: Date.now()
    };
  }

  setIdleThreshold(ms) {
    this.idleThreshold = ms;
  }
}
