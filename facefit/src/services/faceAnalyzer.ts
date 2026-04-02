import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import '@tensorflow/tfjs-backend-webgl'
import type { AnalysisResult, FaceDetectionResult, FaceShapeAnalysis, BeautyScore, EmotionResult, FaceLandmark } from '@/types'

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null

export async function loadModel() {
  if (detector) return detector
  
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
  const detectorConfig = {
    runtime: 'tfjs' as const,
    refineLandmarks: true,
    maxFaces: 1,
  }
  
  detector = await faceLandmarksDetection.createDetector(model, detectorConfig)
  return detector
}

export async function detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDetectionResult | null> {
  const model = await loadModel()
  const faces = await model.estimateFaces(imageElement, { flipHorizontal: false })
  
  if (faces.length === 0) return null
  
  const face = faces[0]
  const keypoints = face.keypoints as FaceLandmark[]
  
  const box = face.box
  const centerX = box.xMin + box.width / 2
  const centerY = box.yMin + box.height / 2
  
  const dx = keypoints[234]?.x - keypoints[454]?.x || 0
  const dy = keypoints[234]?.y - keypoints[454]?.y || 0
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  
  return {
    landmarks: keypoints,
    boundingBox: {
      x: box.xMin,
      y: box.yMin,
      width: box.width,
      height: box.height,
    },
    faceAngle: angle,
  }
}

function calculateFaceShape(landmarks: FaceLandmark[], boundingBox: { width: number; height: number }): FaceShapeAnalysis {
  const foreheadY = landmarks[10].y
  const chinY = landmarks[152].y
  const faceHeight = chinY - foreheadY
  
  const leftCheekX = landmarks[234].x
  const rightCheekX = landmarks[454].x
  const faceWidth = rightCheekX - leftCheekX
  
  const jawLeftY = landmarks[152].y
  const jawRightY = landmarks[152].y
  const jawWidth = Math.abs(landmarks[58].x - landmarks[288].x)
  
  const ratio = faceWidth / faceHeight
  const jawToFaceRatio = jawWidth / faceWidth
  
  let shape: FaceShapeAnalysis['shape'] = 'oval'
  
  if (ratio > 0.85 && ratio < 0.95) {
    shape = 'round'
  } else if (ratio > 0.7 && ratio < 0.85) {
    shape = 'long'
  } else if (jawToFaceRatio < 0.5) {
    shape = 'heart'
  } else if (jawToFaceRatio > 0.6) {
    shape = 'square'
  } else if (ratio > 0.75) {
    shape = 'oblong'
  } else {
    shape = 'oval'
  }
  
  const symmetry = calculateSymmetry(landmarks)
  
  const foreheadRatio = (foreheadY - landmarks[168].y) / faceHeight
  const cheekboneRatio = ((landmarks[234].y + landmarks[454].y) / 2 - (landmarks[10].y + landmarks[152].y) / 2) / faceHeight
  const jawRatio = (chinY - jawLeftY) / faceHeight
  
  return {
    shape,
    symmetry: Math.round(symmetry * 100),
    foreheadRatio: Math.round(foreheadRatio * 100),
    cheekboneRatio: Math.round(cheekboneRatio * 100),
    jawRatio: Math.round(jawRatio * 100),
  }
}

function calculateSymmetry(landmarks: FaceLandmark[]): number {
  const leftEyeOuter = landmarks[33]
  const rightEyeOuter = landmarks[263]
  const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2
  
  const leftCheek = landmarks[234]
  const rightCheek = landmarks[454]
  const cheekCenterX = (leftCheek.x + rightCheek.x) / 2
  
  const noseTip = landmarks[1]
  const faceCenterX = noseTip.x
  
  const deviation = Math.abs(faceCenterX - (eyeCenterX + cheekCenterX) / 2)
  const maxDeviation = 20
  const symmetry = Math.max(0, 1 - deviation / maxDeviation)
  
  return symmetry
}

function calculateBeautyScore(landmarks: FaceLandmark[], faceShape: FaceShapeAnalysis): BeautyScore {
  const symmetryScore = faceShape.symmetry
  
  const foreheadSize = Math.abs(landmarks[10].y - landmarks[168].y)
  const noseSize = Math.abs(landmarks[1].y - landmarks[152].y)
  const lowerFaceSize = Math.abs(landmarks[152].y - landmarks[8].y)
  const totalFaceHeight = lowerFaceSize + foreheadSize + noseSize
  
  const proportionScore = totalFaceHeight > 0 
    ? 100 - Math.abs(foreheadSize / totalFaceHeight - 0.33) * 100 - Math.abs(noseSize / totalFaceHeight - 0.33) * 100
    : 50
  const normalizedProportion = Math.max(0, Math.min(100, proportionScore))
  
  const leftEyeDist = Math.sqrt(
    Math.pow(landmarks[33].x - landmarks[133].x, 2) +
    Math.pow(landmarks[33].y - landmarks[133].y, 2)
  )
  const rightEyeDist = Math.sqrt(
    Math.pow(landmarks[362].x - landmarks[263].x, 2) +
    Math.pow(landmarks[362].y - landmarks[263].y, 2)
  )
  const eyeSymmetry = 100 - Math.abs(leftEyeDist - rightEyeDist) / Math.max(leftEyeDist, rightEyeDist) * 50
  
  const maturity = Math.min(100, 50 + eyeSymmetry * 0.3 + symmetryScore * 0.2)
  
  const overall = Math.round(
    symmetryScore * 0.35 +
    normalizedProportion * 0.35 +
    eyeSymmetry * 0.15 +
    maturity * 0.15
  )
  
  return {
    overall: Math.min(100, Math.max(0, overall)),
    symmetry: Math.round(symmetryScore),
    proportion: Math.round(normalizedProportion),
    maturity: Math.round(maturity),
  }
}

function calculateEmotion(landmarks: FaceLandmark[]): EmotionResult {
  const mouthLeft = landmarks[61]
  const mouthRight = landmarks[291]
  const mouthTop = landmarks[13]
  const mouthBottom = landmarks[14]
  
  const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x)
  const mouthOpenness = Math.abs(mouthBottom.y - mouthTop.y) / mouthWidth
  
  const leftEyebrow = landmarks[70]
  const rightEyebrow = landmarks[300]
  const leftEye = landmarks[159]
  const rightEye = landmarks[386]
  
  const leftEyebrowRaise = (leftEyebrow.y - leftEye.y) / 50
  const rightEyebrowRaise = (rightEyebrow.y - rightEye.y) / 50
  
  const noseWrinkle = landmarks[5].z || 0
  
  const happy = Math.min(100, Math.max(0, mouthOpenness * 200 - 20 + (leftEyebrowRaise + rightEyebrowRaise) * 30))
  const surprised = Math.min(100, Math.max(0, (leftEyebrowRaise + rightEyebrowRaise) * 150 + mouthOpenness * 100))
  const sad = Math.min(100, Math.max(0, 30 - (leftEyebrowRaise + rightEyebrowRaise) * 50 + mouthOpenness * 20))
  const angry = Math.min(100, Math.max(0, 40 - (leftEyebrowRaise + rightEyebrowRaise) * 80))
  const fearful = Math.min(100, Math.max(0, surprised * 0.8 + sad * 0.4))
  const disgusted = Math.min(100, Math.max(0, noseWrinkle * 50 + mouthOpenness * 30))
  const neutral = Math.max(0, 100 - happy - surprised - sad - angry - fearful - disgusted)
  
  const scores = { happy, sad, surprised, angry, fearful, disgusted, neutral }
  
  const emotionLabels: (keyof typeof scores)[] = ['happy', 'sad', 'surprised', 'angry', 'fearful', 'disgusted', 'neutral']
  const dominant = emotionLabels.reduce((a, b) => scores[a] > scores[b] ? a : b, 'neutral') as keyof typeof scores
  
  return {
    dominant: dominant === 'neutral' ? '自然' :
               dominant === 'happy' ? '高兴' :
               dominant === 'sad' ? '悲伤' :
               dominant === 'surprised' ? '惊讶' :
               dominant === 'angry' ? '愤怒' :
               dominant === 'fearful' ? '恐惧' : '厌恶',
    scores: {
      happy: Math.round(scores.happy),
      sad: Math.round(scores.sad),
      surprised: Math.round(scores.surprised),
      angry: Math.round(scores.angry),
      fearful: Math.round(scores.fearful),
      disgusted: Math.round(scores.disgusted),
      neutral: Math.round(scores.neutral),
    },
  }
}

export async function analyzeFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<AnalysisResult | null> {
  const detection = await detectFace(imageElement)
  if (!detection) return null
  
  const faceShape = calculateFaceShape(detection.landmarks, detection.boundingBox)
  const beautyScore = calculateBeautyScore(detection.landmarks, faceShape)
  const emotion = calculateEmotion(detection.landmarks)
  
  return {
    faceShape,
    beautyScore,
    emotion,
    landmarks: detection.landmarks,
  }
}

export function drawLandmarks(canvas: HTMLCanvasElement, landmarks: FaceLandmark[], imageSize: { width: number; height: number }) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const scaleX = canvas.width / imageSize.width
  const scaleY = canvas.height / imageSize.height
  
  ctx.strokeStyle = '#6366F1'
  ctx.fillStyle = '#6366F1'
  ctx.lineWidth = 1
  
  const faceOutlineIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
  
  ctx.beginPath()
  faceOutlineIndices.forEach((idx, i) => {
    const point = landmarks[idx]
    const x = point.x * scaleX
    const y = point.y * scaleY
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.stroke()
  
  const keyPoints = [1, 33, 263, 61, 291, 13, 14, 152]
  keyPoints.forEach(idx => {
    const point = landmarks[idx]
    const x = point.x * scaleX
    const y = point.y * scaleY
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.fill()
  })
  
  const eyeIndices = [[33, 133, 160, 159, 161, 163], [362, 263, 387, 386, 388, 390]]
  eyeIndices.forEach(eye => {
    ctx.strokeStyle = '#EC4899'
    ctx.beginPath()
    eye.forEach((idx, i) => {
      const point = landmarks[idx]
      const x = point.x * scaleX
      const y = point.y * scaleY
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  })
  
  const noseIndices = [1, 2, 3, 4, 5, 6]
  ctx.strokeStyle = '#10B981'
  ctx.beginPath()
  noseIndices.forEach((idx, i) => {
    const point = landmarks[idx]
    const x = point.x * scaleX
    const y = point.y * scaleY
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  
  const mouthIndices = [[61, 62, 63, 64, 65, 66, 67], [291, 292, 293, 294, 295, 296, 297]]
  ctx.strokeStyle = '#F59E0B'
  mouthIndices.forEach(lip => {
    ctx.beginPath()
    lip.forEach((idx, i) => {
      const point = landmarks[idx]
      const x = point.x * scaleX
      const y = point.y * scaleY
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  })
}
