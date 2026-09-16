import type { DisplayOptions } from '@/entities/erd/model'

export function displayName(
  item: { physicalName: string; logicalName?: string | undefined } | undefined,
  options: DisplayOptions,
) {
  if (!item) return '—'
  return [
    options.showLogicalName ? item.logicalName || '—' : null,
    options.showPhysicalName ? item.physicalName : null,
  ]
    .filter((name) => name !== null)
    .join(' · ')
}
