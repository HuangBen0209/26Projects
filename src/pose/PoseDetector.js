export class PoseDetector {
  constructor() {
    this.pose = null;
    this.isReady = false;
    this.lastResults = null;
    this.onResults = null;
    this.landmarks = null;
    this.camera = null;
  }

  async init() {
    return new Promise((resolve) => {
      if (typeof window.Pose === 'undefined') {
        let checkCount = 0;
        const checkPose = setInterval(() => {
          checkCount++;
          if (typeof window.Pose !== 'undefined') {
            clearInterval(checkPose);
            this.setupPose().then(resolve);
          } else if (checkCount > 50) {
            clearInterval(checkPose);
            console.error('MediaPipe Pose failed to load');
            resolve(false);
          }
        }, 100);
      } else {
        this.setupPose().then(resolve);
      }
    });
  }

  async setupPose() {
    try {
      this.pose = new window.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.pose.onResults((results) => {
        this.lastResults = results;
        this.landmarks = results.poseLandmarks;
        if (this.onResults) {
          this.onResults(results);
        }
      });

      await this.pose.initialize();
      this.isReady = true;
      return true;
    } catch (error) {
      console.error('Failed to setup Pose:', error);
      return false;
    }
  }

  async startCamera(videoElement) {
    if (!this.isReady || !videoElement) {
      console.error('Pose not initialized or no video element');
      return false;
    }

    try {
      if (typeof window.Camera === 'undefined') {
        console.error('MediaPipe Camera utils not loaded');
        return false;
      }

      this.camera = new window.Camera(videoElement, {
        onFrame: async () => {
          if (this.pose) {
            await this.pose.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      return true;
    } catch (error) {
      console.error('Failed to start camera:', error);
      return false;
    }
  }

  stopCamera() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
  }

  async detect(videoElement) {
    if (!this.isReady || !this.pose || !videoElement) {
      return null;
    }

    try {
      await this.pose.send({ image: videoElement });
    } catch (error) {
      console.error('Pose detection error:', error);
    }
  }

  getLandmarks() {
    return this.landmarks;
  }

  getKeyLandmarks() {
    if (!this.landmarks) return null;

    return {
      leftShoulder: this.landmarks[11],
      rightShoulder: this.landmarks[12],
      leftElbow: this.landmarks[13],
      rightElbow: this.landmarks[14],
      leftWrist: this.landmarks[15],
      rightWrist: this.landmarks[16]
    };
  }

  isValidPose() {
    if (!this.landmarks) return false;

    const requiredIndices = [11, 12, 13, 14, 15, 16];
    return requiredIndices.every(idx => {
      const landmark = this.landmarks[idx];
      return landmark && landmark.visibility > 0.5;
    });
  }

  drawLandmarks(canvasCtx, landmarks) {
    if (!landmarks || !canvasCtx) return;

    canvasCtx.fillStyle = '#10B981';
    canvasCtx.strokeStyle = '#10B981';
    canvasCtx.lineWidth = 2;

    const drawLandmark = (landmark) => {
      if (!landmark || landmark.visibility < 0.5) return;

      const x = landmark.x * canvasCtx.canvas.width;
      const y = landmark.y * canvasCtx.canvas.height;

      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);
      canvasCtx.fill();
    };

    const connections = [
      [11, 13], [13, 15],
      [12, 14], [14, 16],
      [11, 12]
    ];

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(start.x * canvasCtx.canvas.width, start.y * canvasCtx.canvas.height);
        canvasCtx.lineTo(end.x * canvasCtx.canvas.width, end.y * canvasCtx.canvas.height);
        canvasCtx.stroke();
      }
    });

    [11, 12, 13, 14, 15, 16].forEach(idx => {
      if (landmarks[idx]) {
        drawLandmark(landmarks[idx]);
      }
    });
  }

  destroy() {
    this.stopCamera();
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isReady = false;
    this.lastResults = null;
    this.landmarks = null;
  }
}
