import { ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function HistoryView() {
  const { setCurrentView } = useAppStore()
  
  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setCurrentView('home')}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">历史记录</h2>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-text-secondary" />
          </div>
          <p className="text-text-secondary mb-2">暂无历史记录</p>
          <p className="text-sm text-text-secondary/70">您的分析历史将显示在这里</p>
        </div>
      </div>
    </div>
  )
}
