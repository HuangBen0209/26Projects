import { useAppStore } from '@/store/useAppStore'
import Sidebar from '@/components/Sidebar'
import HomeView from '@/components/HomeView'
import CameraView from '@/components/CameraView'
import AnalysisView from '@/components/AnalysisView'
import HistoryView from '@/components/HistoryView'

function App() {
  const { currentView } = useAppStore()
  
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />
      case 'camera':
        return <CameraView />
      case 'analysis':
        return <AnalysisView />
      case 'history':
        return <HistoryView />
      default:
        return <HomeView />
    }
  }
  
  return (
    <div className="flex w-full h-full">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-background">
        {renderView()}
      </main>
    </div>
  )
}

export default App
