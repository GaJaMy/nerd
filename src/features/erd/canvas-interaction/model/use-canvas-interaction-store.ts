import { create } from 'zustand'

type CanvasInteractionStore = {
  mode: 'draw' | 'pan'
  setMode: (mode: 'draw' | 'pan') => void
}

export const useCanvasInteractionStore = create<CanvasInteractionStore>((set) => ({
  mode: 'draw',
  setMode: (mode) => set({ mode }),
}))
