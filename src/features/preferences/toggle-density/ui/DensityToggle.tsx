import { Gauge } from 'lucide-react'
import { useDensityPreference } from '../model/use-density-preference'
import { IconButton } from '@/shared/ui/icon-button'

export function DensityToggle() {
  const { density, toggleDensity } = useDensityPreference()
  const label = density === 'compact' ? 'Use comfortable density' : 'Use compact density'

  return <IconButton icon={Gauge} label={label} onClick={toggleDensity} />
}
