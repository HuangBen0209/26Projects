import { MOTION_THRESHOLDS, COOLDOWN_DURATION } from '../utils/constants.js';

export class MotionMapper {
  constructor() {
    this.thresholds = { ...MOTION_THRESHOLDS };
    this.thresholdMultiplier = 1;

    this.calibrationData = {
      leftArmAngle: 0,
      rightArmAngle: 0,
      isCalibrated: false
    };

    this.lastArmState = {
      left: 'down',
      right: 'down'
    };

    this.armAngles = {
      left: 0,
      right: 0
    };

    this.pressStartTime = {
      left: null,
      right: null
    };

    this.crossedArms = false;
    this.crossedArmsStartTime = null;

    this.onMotionDetected = null;

    this.cooldowns = {
      leftSwipe: 0,
      rightSwipe: 0,
      rotate: 0,
      quickDrop: 0,
      push: 0,
      pause: 0
    };

    this.cooldownDuration = COOLDOWN_DURATION;
  }

  setThresholds(multiplier) {
    this.thresholdMultiplier = multiplier;
  }

  updateThresholds(settings) {
    if (settings.armAngle !== undefined) {
      this.thresholds.ARM_ANGLE = settings.armAngle;
    }
    if (settings.liftAngle !== undefined) {
      this.thresholds.LIFT_ANGLE = settings.liftAngle;
    }
    if (settings.pushAngle !== undefined) {
      this.thresholds.PUSH_ANGLE = settings.pushAngle;
    }
  }

  calibrate(keyLandmarks) {
    if (!keyLandmarks) return false;

    const leftArmAngle = this.calculateArmAngle(
      keyLandmarks.leftShoulder,
      keyLandmarks.leftElbow,
      keyLandmarks.leftWrist
    );

    const rightArmAngle = this.calculateArmAngle(
      keyLandmarks.rightShoulder,
      keyLandmarks.rightElbow,
      keyLandmarks.rightWrist
    );

    this.calibrationData = {
      leftArmAngle: leftArmAngle,
      rightArmAngle: rightArmAngle,
      isCalibrated: true
    };

    return true;
  }

  resetCalibration() {
    this.calibrationData = {
      leftArmAngle: 0,
      rightArmAngle: 0,
      isCalibrated: false
    };
  }

  getEffectiveThreshold(baseThreshold) {
    return baseThreshold * this.thresholdMultiplier;
  }

  calculateAngle(point1, point2, point3) {
    if (!point1 || !point2 || !point3) return 0;

    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                     Math.atan2(point1.y - point2.y, point1.x - point2.x);
    let angle = Math.abs(radians * 180 / Math.PI);

    if (angle > 180) angle = 360 - angle;

    return angle;
  }

  calculateArmAngle(shoulder, elbow, wrist) {
    return this.calculateAngle(shoulder, elbow, wrist);
  }

  isArmExtended(shoulder, elbow, wrist) {
    return this.calculateArmAngle(shoulder, elbow, wrist);
  }

  isArmForward(shoulder, elbow, wrist, hip) {
    if (!hip) return false;

    const wristDist = Math.abs(wrist.x - hip.x);
    const shoulderDist = Math.abs(shoulder.x - hip.x);

    return wristDist < shoulderDist * 0.5;
  }

  areArmsCrossed(leftWrist, rightWrist) {
    if (!leftWrist || !rightWrist) return false;

    return Math.abs(leftWrist.y - rightWrist.y) < MOTION_THRESHOLDS.CROSS_ARMS_Y_THRESHOLD &&
           Math.abs(leftWrist.x - rightWrist.x) < MOTION_THRESHOLDS.CROSS_ARMS_X_THRESHOLD;
  }

  update(keyLandmarks) {
    if (!keyLandmarks) return;

    const now = Date.now();

    let leftArmAngle = this.calculateArmAngle(
      keyLandmarks.leftShoulder,
      keyLandmarks.leftElbow,
      keyLandmarks.leftWrist
    );

    let rightArmAngle = this.calculateArmAngle(
      keyLandmarks.rightShoulder,
      keyLandmarks.rightElbow,
      keyLandmarks.rightWrist
    );

    if (this.calibrationData.isCalibrated) {
      leftArmAngle = Math.max(0, leftArmAngle - this.calibrationData.leftArmAngle);
      rightArmAngle = Math.max(0, rightArmAngle - this.calibrationData.rightArmAngle);
    }

    this.armAngles.left = leftArmAngle;
    this.armAngles.right = rightArmAngle;

    const effectiveArmThreshold = this.getEffectiveThreshold(this.thresholds.ARM_ANGLE);
    const effectiveLiftThreshold = this.getEffectiveThreshold(this.thresholds.LIFT_ANGLE);
    const effectivePushThreshold = this.getEffectiveThreshold(this.thresholds.PUSH_ANGLE);

    const leftArmState = leftArmAngle >= effectiveLiftThreshold ? 'up' : 'down';
    const rightArmState = rightArmAngle >= effectiveLiftThreshold ? 'up' : 'down';

    const leftWrist = keyLandmarks.leftWrist;
    const rightWrist = keyLandmarks.rightWrist;

    const isLeftSwipe = leftArmAngle >= effectiveArmThreshold &&
                        leftArmAngle < effectiveLiftThreshold &&
                        leftWrist.x < keyLandmarks.leftShoulder.x - MOTION_THRESHOLDS.SWIPE_HORIZONTAL_OFFSET;

    const isRightSwipe = rightArmAngle >= effectiveArmThreshold &&
                         rightArmAngle < effectiveLiftThreshold &&
                         rightWrist.x > keyLandmarks.rightShoulder.x + MOTION_THRESHOLDS.SWIPE_HORIZONTAL_OFFSET;

    const isRotate = leftArmState === 'up' && rightArmState === 'up' &&
                     leftArmAngle >= effectiveLiftThreshold &&
                     rightArmAngle >= effectiveLiftThreshold;

    const areCrossed = this.areArmsCrossed(leftWrist, rightWrist);

    if (areCrossed && !this.crossedArms) {
      this.crossedArms = true;
      this.crossedArmsStartTime = now;

      if (now - this.cooldowns.pause > this.cooldownDuration) {
        this.cooldowns.pause = now;
        if (this.onMotionDetected) {
          this.onMotionDetected('pause');
        }
      }
    } else if (!areCrossed) {
      this.crossedArms = false;
      this.crossedArmsStartTime = null;
    }

    if (this.lastArmState.left === 'up' && leftArmState === 'down') {
      const pressDuration = this.pressStartTime.left ? now - this.pressStartTime.left : Infinity;

      if (pressDuration <= MOTION_THRESHOLDS.QUICK_PRESS_DURATION &&
          now - this.cooldowns.quickDrop > this.cooldownDuration) {
        this.cooldowns.quickDrop = now;
        if (this.onMotionDetected) {
          this.onMotionDetected('quickDrop');
        }
      }
    }

    if (leftArmState === 'up') {
      this.pressStartTime.left = now;
    }

    if (isLeftSwipe && now - this.cooldowns.leftSwipe > this.cooldownDuration) {
      this.cooldowns.leftSwipe = now;
      if (this.onMotionDetected) {
        this.onMotionDetected('leftSwipe');
      }
    }

    if (isRightSwipe && now - this.cooldowns.rightSwipe > this.cooldownDuration) {
      this.cooldowns.rightSwipe = now;
      if (this.onMotionDetected) {
        this.onMotionDetected('rightSwipe');
      }
    }

    if (isRotate && now - this.cooldowns.rotate > this.cooldownDuration) {
      this.cooldowns.rotate = now;
      if (this.onMotionDetected) {
        this.onMotionDetected('rotate');
      }
    }

    const isLeftPush = leftArmAngle >= effectivePushThreshold;
    const isRightPush = rightArmAngle >= effectivePushThreshold;

    if ((isLeftPush || isRightPush) && now - this.cooldowns.push > this.cooldownDuration) {
      this.cooldowns.push = now;
      if (this.onMotionDetected) {
        this.onMotionDetected('push');
      }
    }

    this.lastArmState.left = leftArmState;
    this.lastArmState.right = rightArmState;
  }

  getCurrentAngles() {
    return {
      left: this.armAngles.left,
      right: this.armAngles.right
    };
  }

  isCalibrated() {
    return this.calibrationData.isCalibrated;
  }

  reset() {
    this.lastArmState = {
      left: 'down',
      right: 'down'
    };

    this.pressStartTime = {
      left: null,
      right: null
    };

    this.crossedArms = false;
    this.crossedArmsStartTime = null;

    Object.keys(this.cooldowns).forEach(key => {
      this.cooldowns[key] = 0;
    });
  }
}
