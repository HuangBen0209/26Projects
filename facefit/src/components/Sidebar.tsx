import { Camera, Upload, History, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const navItems = [
  { id: 'home' as const, label: '首页', icon: Sparkles },
  { id: 'camera' as const, label: '摄像头', icon: Camera },
  { id: 'history' as const, label: '历史', icon: History },
]

export default function Sidebar() {
  const { currentView, setCurrentView } = useAppStore()
  
  return (
    <aside className="w-60 bg-surface border-r border-slate-700 flex flex-col h-full">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">FaceFit</h1>
            <p className="text-xs text-text-secondary">脸部评估系统</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-secondary hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-text-secondary">
          <p>版本 1.0.0</p>
          <p className="mt-1">基于 TensorFlow.js</p>
        </div>
      </div>
    </aside>
  )
}
