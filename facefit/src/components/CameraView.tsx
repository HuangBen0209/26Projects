import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, StopCircle, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { loadModel, detectFace, drawLandmarks } from '@/services/faceAnalyzer'

export default function CameraView() {
  const { setCurrentView, setCurrentResult, setIsAnalyzing, cameraActive, setCameraActive } = useAppStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const animationRef = useRef<number>()
  
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      setStream(mediaStream)
      setCameraActive(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      
      setIsModelLoading(true)
      await loadModel()
      setIsModelLoading(false)
    } catch (err) {
      setError('无法访问摄像头，请确保已授予摄像头权限')
      console.error('Camera error:', err)
    }
  }, [setCameraActive])
  
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [stream, setCameraActive])
  
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [stream])
  
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 640
    canvas.height = 480
    
    const detect = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const result = await detectFace(video)
        if (result) {
          drawLandmarks(canvas, result.landmarks, { width: 640, height: 480 })
        }
      }
      animationRef.current = requestAnimationFrame(detect)
    }
    
    detect()
  }, [cameraActive])
  
  const captureAndAnalyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg')
      useAppStore.getState().setCurrentImage(dataUrl)
      useAppStore.getState().setCurrentView('analysis')
      useAppStore.getState().setIsAnalyzing(true)
      useAppStore.getState().setCurrentResult(null)
      stopCamera()
    }
  }, [stopCamera])
  
  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setCurrentView('home')}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">摄像头检测</h2>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative rounded-2xl overflow-hidden bg-surface border border-slate-700">
          {!cameraActive ? (
            <div className="w-[640px] h-[480px] flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center">
                <Camera className="w-10 h-10 text-text-secondary" />
              </div>
              <div className="text-center">
                <p className="text-text-secondary mb-2">摄像头未启动</p>
                <button
                  onClick={startCamera}
                  disabled={isModelLoading}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isModelLoading ? '加载模型中...' : '启动摄像头'}
                </button>
              </div>
              {error && (
                <p className="text-error text-sm">{error}</p>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-[640px] h-[480px] object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-[640px] h-[480px] pointer-events-none"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  onClick={captureAndAnalyze}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  拍照分析
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-error/20 hover:bg-error/30 text-error rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <StopCircle className="w-5 h-5" />
                  停止
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
