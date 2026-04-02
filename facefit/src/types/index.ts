export interface ElectronAPI {
  openFile: () => Promise<{ canceled: boolean; filePaths: string[] }>
  saveFile: (data: { buffer: ArrayBuffer; filename: string }) => Promise<{ canceled: boolean; filePath?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export interface FaceLandmark {
  x: number
  y: number
  z: number
}

export interface FaceDetectionResult {
  landmarks: FaceLandmark[]
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  faceAngle: number
}

export interface FaceShapeAnalysis {
  shape: 'oval' | 'square' | 'round' | 'heart' | 'long' | 'oblong'
  symmetry: number
  foreheadRatio: number
  cheekboneRatio: number
  jawRatio: number
}

export interface BeautyScore {
  overall: number
  symmetry: number
  proportion: number
  maturity: number
}

export interface EmotionResult {
  dominant: string
  scores: {
    happy: number
    sad: number
    surprised: number
    angry: number
    fearful: number
    disgusted: number
    neutral: number
  }
}

export interface AnalysisResult {
  faceShape: FaceShapeAnalysis
  beautyScore: BeautyScore
  emotion: EmotionResult
  landmarks: FaceLandmark[]
  imageData?: string
}
