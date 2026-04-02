import { useCallback, useRef } from 'react'
import { Upload, Camera } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function HomeView() {
  const { setCurrentView, setCurrentImage, setIsAnalyzing, setCurrentResult } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = useCallback(async () => {
    fileInputRef.current?.click()
  }, [])
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCurrentImage(event.target?.result as string)
        setCurrentView('analysis')
        setIsAnalyzing(true)
        setCurrentResult(null)
      }
      reader.readAsDataURL(file)
    }
  }, [setCurrentImage, setCurrentView, setIsAnalyzing, setCurrentResult])
  
  const handleOpenCamera = useCallback(() => {
    setCurrentView('camera')
    setCurrentImage(null)
    setCurrentResult(null)
  }, [setCurrentView, setCurrentImage, setCurrentResult])
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          欢迎使用 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">FaceFit</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-md mx-auto">
          基于先进的计算机视觉技术，为您提供专业的面部结构分析、颜值评分和情绪识别服务
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={handleFileSelect}
          className="group relative overflow-hidden rounded-2xl bg-surface border border-slate-700 p-8 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">上传图片</h3>
              <p className="text-text-secondary text-sm">选择本地图片进行分析</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={handleOpenCamera}
          className="group relative overflow-hidden rounded-2xl bg-surface border border-slate-700 p-8 hover:border-secondary/50 transition-all hover:shadow-lg hover:shadow-secondary/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">摄像头检测</h3>
              <p className="text-text-secondary text-sm">实时面部分析</p>
            </div>
          </div>
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div className="mt-16 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-primary">98.5%</div>
          <div className="text-text-secondary text-sm">检测准确率</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-secondary">&lt;3s</div>
          <div className="text-text-secondary text-sm">分析耗时</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent">100%</div>
          <div className="text-text-secondary text-sm">隐私保护</div>
        </div>
      </div>
    </div>
  )
}
