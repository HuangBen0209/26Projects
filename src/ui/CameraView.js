export class CameraView {
  constructor() {
    this.video = document.getElementById('camera-video');
    this.canvas = document.getElementById('camera-canvas');
    this.overlay = document.getElementById('camera-overlay');
    this.posePoints = document.getElementById('pose-points');
    this.cameraSelect = document.getElementById('camera-select');

    this.ctx = this.canvas.getContext('2d');
    this.stream = null;
    this.isActive = false;
  }

  async init() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');

      if (this.cameraSelect) {
        this.cameraSelect.innerHTML = '<option value="">选择摄像头...</option>';
        cameras.forEach((camera, index) => {
          const option = document.createElement('option');
          option.value = camera.deviceId;
          option.textContent = camera.label || `摄像头 ${index + 1}`;
          this.cameraSelect.appendChild(option);
        });
      }

      return cameras.length > 0;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return false;
    }
  }

  async start(deviceId = null) {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };

      if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.isActive = true;

      await new Promise((resolve) => {
        this.video.onloadedmetadata = resolve;
      });

      await this.video.play();

      if (this.overlay) {
        this.overlay.style.display = 'none';
      }

      return true;
    } catch (error) {
      console.error('Failed to start camera:', error);
      if (this.overlay) {
        this.overlay.innerHTML = '<span>摄像头启动失败</span>';
      }
      return false;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.isActive = false;
  }

  async switchCamera(deviceId) {
    this.stop();
    return await this.start(deviceId);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawResults(landmarks, poseDetector) {
    this.clearCanvas();

    if (landmarks && poseDetector) {
      poseDetector.drawLandmarks(this.ctx, landmarks);
    }
  }

  updateAngleDisplay(angles) {
    if (!this.posePoints) return;

    if (angles) {
      this.posePoints.innerHTML = `
        <div class="pose-angle">左臂: ${Math.round(angles.left)}°</div>
        <div class="pose-angle">右臂: ${Math.round(angles.right)}°</div>
      `;
    }
  }

  getVideoElement() {
    return this.video;
  }

  getCanvasElement() {
    return this.canvas;
  }

  isCameraActive() {
    return this.isActive;
  }
}
