export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 30;

export const COLORS = {
  I: '#00F5FF',
  L: '#FF8C00',
  J: '#1E90FF',
  O: '#FFD700',
  S: '#32CD32',
  T: '#9932CC',
  Z: '#FF4500',
  ghost: 'rgba(255, 255, 255, 0.2)',
  grid: 'rgba(255, 255, 255, 0.05)',
  background: '#0F172A'
};

export const PIECES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: COLORS.I
  },
  L: {
    shape: [[1, 0], [1, 0], [1, 1]],
    color: COLORS.L
  },
  J: {
    shape: [[0, 1], [0, 1], [1, 1]],
    color: COLORS.J
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: COLORS.O
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0]],
    color: COLORS.S
  },
  T: {
    shape: [[1, 1, 1], [0, 1, 0]],
    color: COLORS.T
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1]],
    color: COLORS.Z
  }
};

export const SCORE_TABLE = {
  1: 10,
  2: 30,
  3: 60,
  4: 100
};

export const COMBO_BONUS = 20;
export const LINES_PER_LEVEL = 10;
export const MAX_LEVEL = 10;

export const INITIAL_DROP_INTERVAL = 1000;
export const LEVEL_SPEED_DECREASE = 80;

export const MODES = {
  classic: {
    name: '经典模式',
    speedMultiplier: 1,
    armThresholdMultiplier: 1
  },
  relax: {
    name: '肩颈放松',
    speedMultiplier: 0.7,
    armThresholdMultiplier: 0.8
  },
  fatburn: {
    name: '燃脂强化',
    speedMultiplier: 1.2,
    armThresholdMultiplier: 1
  },
  rehab: {
    name: '康复训练',
    speedMultiplier: 0.5,
    armThresholdMultiplier: 0.7
  }
};

export const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16
};

export const MOTION_THRESHOLDS = {
  ARM_ANGLE: 60,
  LIFT_ANGLE: 90,
  PUSH_ANGLE: 120,
  QUICK_PRESS_DURATION: 1000
};

export const CALORIE_COSTS = {
  SWIPE: 0.5,
  QUICK_DROP: 0.3,
  PUSH: 0.8,
  ROTATE: 0.2
};
