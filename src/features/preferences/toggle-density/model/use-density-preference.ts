import { create } from 'zustand'

type Density = 'comfortable' | 'compact'

type DensityPreferenceState = {
  density: Density
  toggleDensity: () => void
}

export const useDensityPreference = create<DensityPreferenceState>((set) => ({
  density: 'comfortable',
  toggleDensity: () =>
    set((state) => ({
      density: state.density === 'comfortable' ? 'compact' : 'comfortable',
    })),
}))
