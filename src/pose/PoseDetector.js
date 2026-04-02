export class PoseDetector {
  constructor() {
    this.pose = null;
    this.isReady = false;
    this.lastResults = null;
    this.onResults = null;
  }

  async init() {
    try {
      const { Pose } = await import('@mediapipe/pose');

      this.pose = new Pose({
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
        if (this.onResults) {
          this.onResults(results);
        }
      });

      await this.pose.initialize();
      this.isReady = true;

      return true;
    } catch (error) {
      console.error('Failed to initialize Pose:', error);
      return false;
    }
  }

  async detect(videoElement) {
    if (!this.isReady || !this.pose) {
      return null;
    }

    try {
      await this.pose.send({ image: videoElement });
    } catch (error) {
      console.error('Pose detection error:', error);
    }
  }

  getLandmarks() {
    if (!this.lastResults || !this.lastResults.poseLandmarks) {
      return null;
    }

    return this.lastResults.poseLandmarks;
  }

  getKeyLandmarks() {
    const landmarks = this.getLandmarks();
    if (!landmarks) return null;

    return {
      leftShoulder: landmarks[11],
      rightShoulder: landmarks[12],
      leftElbow: landmarks[13],
      rightElbow: landmarks[14],
      leftWrist: landmarks[15],
      rightWrist: landmarks[16]
    };
  }

  isValidPose() {
    const landmarks = this.getLandmarks();
    if (!landmarks) return false;

    const requiredIndices = [11, 12, 13, 14, 15, 16];
    return requiredIndices.every(idx => {
      const landmark = landmarks[idx];
      return landmark && landmark.visibility > 0.5;
    });
  }

  drawLandmarks(canvasCtx, landmarks) {
    if (!landmarks) return;

    canvasCtx.fillStyle = '#10B981';
    canvasCtx.strokeStyle = '#10B981';
    canvasCtx.lineWidth = 2;

    const drawLandmark = (landmark) => {
      if (landmark.visibility < 0.5) return;

      const x = landmark.x * canvasCtx.canvas.width;
      const y = landmark.y * canvasCtx.canvas.height;

      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);
      canvasCtx.fill();
    };

    const connections = [
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 12]            // shoulders
    ];

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (start.visibility > 0.5 && end.visibility > 0.5) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(start.x * canvasCtx.canvas.width, start.y * canvasCtx.canvas.height);
        canvasCtx.lineTo(end.x * canvasCtx.canvas.width, end.y * canvasCtx.canvas.height);
        canvasCtx.stroke();
      }
    });

    [11, 12, 13, 14, 15, 16].forEach(idx => {
      drawLandmark(landmarks[idx]);
    });
  }

  destroy() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isReady = false;
    this.lastResults = null;
  }
}
