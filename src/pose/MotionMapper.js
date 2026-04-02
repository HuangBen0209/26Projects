import { POSE_LANDMARKS, MOTION_THRESHOLDS } from '../utils/constants.js';

export class MotionMapper {
  constructor() {
    this.thresholds = { ...MOTION_THRESHOLDS };
    this.thresholdMultiplier = 1;

    this.lastArmState = {
      left: 'down',
      right: 'down',
      both: 'down'
    };

    this.armPositions = {
      left: { shoulder: null, elbow: null, wrist: null },
      right: { shoulder: null, elbow: null, wrist: null }
    };

    this.armAngles = {
      left: 0,
      right: 0
    };

    this.pressStartTime = {
      left: null,
      right: null,
      both: null
    };

    this.lastWristPositions = {
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

    this.cooldownDuration = 300;
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
    const angle = this.calculateArmAngle(shoulder, elbow, wrist);
    return angle;
  }

  isArmForward(shoulder, elbow, wrist, hip) {
    if (!hip) return false;

    const wristDist = Math.abs(wrist.x - hip.x);
    const shoulderDist = Math.abs(shoulder.x - hip.x);

    return wristDist < shoulderDist * 0.5;
  }

  areArmsCrossed(leftWrist, rightWrist) {
    if (!leftWrist || !rightWrist) return false;

    return Math.abs(leftWrist.y - rightWrist.y) < 0.05 &&
           Math.abs(leftWrist.x - rightWrist.x) < 0.08;
  }

  update(keyLandmarks) {
    if (!keyLandmarks) return;

    const now = Date.now();

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

    this.armAngles.left = leftArmAngle;
    this.armAngles.right = rightArmAngle;

    const effectiveArmThreshold = this.thresholds.ARM_ANGLE * this.thresholdMultiplier;
    const effectiveLiftThreshold = this.thresholds.LIFT_ANGLE * this.thresholdMultiplier;
    const effectivePushThreshold = this.thresholds.PUSH_ANGLE * this.thresholdMultiplier;

    const leftArmState = leftArmAngle >= effectiveLiftThreshold ? 'up' : 'down';
    const rightArmState = rightArmAngle >= effectiveLiftThreshold ? 'up' : 'down';

    const leftWrist = keyLandmarks.leftWrist;
    const rightWrist = keyLandmarks.rightWrist;

    const isLeftSwipe = leftArmAngle >= effectiveArmThreshold &&
                        leftArmAngle < effectiveLiftThreshold &&
                        leftWrist.x < keyLandmarks.leftShoulder.x - 0.1;

    const isRightSwipe = rightArmAngle >= effectiveArmThreshold &&
                         rightArmAngle < effectiveLiftThreshold &&
                         rightWrist.x > keyLandmarks.rightShoulder.x + 0.1;

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

    this.lastWristPositions.left = leftWrist;
    this.lastWristPositions.right = rightWrist;
  }

  getCurrentAngles() {
    return {
      left: this.armAngles.left,
      right: this.armAngles.right
    };
  }

  reset() {
    this.lastArmState = {
      left: 'down',
      right: 'down',
      both: 'down'
    };

    this.pressStartTime = {
      left: null,
      right: null,
      both: null
    };

    this.crossedArms = false;
    this.crossedArmsStartTime = null;

    Object.keys(this.cooldowns).forEach(key => {
      this.cooldowns[key] = 0;
    });
  }
}
