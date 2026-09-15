import type { CanvasPosition, CanvasViewport } from '@/entities/erd/model'

export function getDrawnTable(
  start: CanvasPosition,
  end: CanvasPosition,
  viewport: CanvasViewport,
) {
  if (Math.hypot(end.x - start.x, end.y - start.y) < 8) return null
  return {
    position: {
      x: (Math.min(start.x, end.x) - viewport.x) / viewport.zoom,
      y: (Math.min(start.y, end.y) - viewport.y) / viewport.zoom,
    },
    size: {
      width: Math.max(360, Math.abs(end.x - start.x) / viewport.zoom),
      height: Math.max(140, Math.abs(end.y - start.y) / viewport.zoom),
    },
  }
}
