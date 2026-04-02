import { create } from 'zustand'
import type { AnalysisResult } from '@/types'

interface AppState {
  currentView: 'home' | 'camera' | 'analysis' | 'history'
  isAnalyzing: boolean
  currentImage: string | null
  currentResult: AnalysisResult | null
  cameraActive: boolean
  setCurrentView: (view: AppState['currentView']) => void
  setIsAnalyzing: (analyzing: boolean) => void
  setCurrentImage: (image: string | null) => void
  setCurrentResult: (result: AnalysisResult | null) => void
  setCameraActive: (active: boolean) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'home',
  isAnalyzing: false,
  currentImage: null,
  currentResult: null,
  cameraActive: false,
  setCurrentView: (view) => set({ currentView: view }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setCurrentImage: (image) => set({ currentImage: image }),
  setCurrentResult: (result) => set({ currentResult: result }),
  setCameraActive: (active) => set({ cameraActive: active }),
  reset: () => set({
    currentView: 'home',
    isAnalyzing: false,
    currentImage: null,
    currentResult: null,
    cameraActive: false,
  }),
}))
