import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, Download, RefreshCw, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { analyzeFace, drawLandmarks } from '@/services/faceAnalyzer'
import type { AnalysisResult } from '@/types'

const emotionLabels: Record<string, string> = {
  happy: '高兴',
  sad: '悲伤',
  surprised: '惊讶',
  angry: '愤怒',
  fearful: '恐惧',
  disgusted: '厌恶',
  neutral: '自然',
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#334155"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  )
}

function EmotionBar({ emotion, score }: { emotion: string; score: number }) {
  const label = emotionLabels[emotion] || emotion
  const color = emotion === 'happy' ? '#10B981' : 
                emotion === 'sad' ? '#6366F1' : 
                emotion === 'surprised' ? '#F59E0B' :
                emotion === 'angry' ? '#EF4444' :
                emotion === 'fearful' ? '#8B5CF6' :
                emotion === 'disgusted' ? '#EC4899' : '#94A3B8'
  
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-sm">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 text-sm text-right">{score}%</span>
    </div>
  )
}

const faceShapeLabels: Record<string, string> = {
  oval: '椭圆脸',
  square: '方脸',
  round: '圆脸',
  heart: '心形脸',
  long: '长脸',
  oblong: '长方形脸',
}

export default function AnalysisView() {
  const { currentImage, currentResult, isAnalyzing, setCurrentResult, setIsAnalyzing, setCurrentView } = useAppStore()
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const runAnalysis = useCallback(async () => {
    if (!currentImage || !imageRef.current) return
    
    setLoading(true)
    setError(null)
    
    try {
      const img = imageRef.current
      if (img.complete && img.naturalWidth > 0) {
        const result = await analyzeFace(img)
        if (result) {
          setCurrentResult(result)
          
          if (canvasRef.current) {
            canvasRef.current.width = img.naturalWidth
            canvasRef.current.height = img.naturalHeight
            drawLandmarks(canvasRef.current, result.landmarks, {
              width: img.naturalWidth,
              height: img.naturalHeight,
            })
          }
        } else {
          setError('未检测到人脸，请上传包含清晰人脸的图片')
        }
      }
    } catch (err) {
      setError('分析失败，请重试')
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
      setIsAnalyzing(false)
    }
  }, [currentImage, setCurrentResult, setIsAnalyzing])
  
  useEffect(() => {
    if (currentImage && isAnalyzing) {
      runAnalysis()
    }
  }, [currentImage, isAnalyzing])
  
  const handleBack = () => {
    setCurrentView('home')
  }
  
  const handleReset = () => {
    useAppStore.getState().reset()
  }
  
  const handleSaveResult = async () => {
    if (!currentResult || !canvasRef.current) return
    
    try {
      const canvas = canvasRef.current
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `facefit-analysis-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Save error:', err)
    }
  }
  
  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">分析结果</h2>
      </div>
      
      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col items-center">
          <div className="relative rounded-2xl overflow-hidden bg-surface border border-slate-700 mb-4">
            {currentImage && (
              <>
                <img
                  ref={imageRef}
                  src={currentImage}
                  alt="Analyzed face"
                  className="max-h-[400px] object-contain"
                  onLoad={() => isAnalyzing && runAnalysis()}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </>
            )}
            {(loading || isAnalyzing) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-text-secondary">正在分析...</span>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-error text-sm mb-4">{error}</div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => { useAppStore.getState().setIsAnalyzing(true); runAnalysis() }}
              disabled={loading || !currentImage}
              className="px-4 py-2 bg-surface hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              重新分析
            </button>
            <button
              onClick={handleSaveResult}
              disabled={!currentResult}
              className="px-4 py-2 bg-surface hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              导出结果
            </button>
          </div>
        </div>
        
        <div className="w-96 overflow-y-auto space-y-6">
          {currentResult ? (
            <>
              <div className="bg-surface rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold mb-4">颜值评分</h3>
                <div className="flex justify-around">
                  <ScoreRing score={currentResult.beautyScore.overall} label="综合评分" color="#6366F1" />
                  <ScoreRing score={currentResult.beautyScore.symmetry} label="对称性" color="#10B981" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-lg font-semibold text-secondary">{currentResult.beautyScore.proportion}</div>
                    <div className="text-xs text-text-secondary">比例协调</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-lg font-semibold text-accent">{currentResult.beautyScore.maturity}</div>
                    <div className="text-xs text-text-secondary">成熟度</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold mb-4">面部结构</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-text-secondary">脸型</span>
                    <span className="font-medium">{faceShapeLabels[currentResult.faceShape.shape]}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-text-secondary">对称度</span>
                    <span className="font-medium text-success">{currentResult.faceShape.symmetry}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-text-secondary">上庭比例</span>
                    <span className="font-medium">{currentResult.faceShape.foreheadRatio}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-text-secondary">中庭比例</span>
                    <span className="font-medium">{currentResult.faceShape.cheekboneRatio}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-text-secondary">下庭比例</span>
                    <span className="font-medium">{currentResult.faceShape.jawRatio}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold mb-4">表情与情绪</h3>
                <div className="text-center p-4 bg-background rounded-lg mb-4">
                  <div className="text-sm text-text-secondary mb-1">主要表情</div>
                  <div className="text-2xl font-bold text-accent">{currentResult.emotion.dominant}</div>
                </div>
                <div className="space-y-2">
                  {Object.entries(currentResult.emotion.scores).map(([emotion, score]) => (
                    <EmotionBar key={emotion} emotion={emotion} score={score} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary">
              {!currentImage && '请上传图片开始分析'}
              {currentImage && !error && !loading && !isAnalyzing && '分析完成'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
