import { useCanvasInteractionStore } from '../model/use-canvas-interaction-store'

export function CanvasTools() {
  const { mode, setMode } = useCanvasInteractionStore()
  return (
    <div className="ml-auto flex gap-2" aria-label="캔버스 도구">
      <button
        type="button"
        className="rounded border px-3 py-2 aria-pressed:bg-slate-900 aria-pressed:text-white"
        aria-pressed={mode === 'draw'}
        onClick={() => setMode('draw')}
      >
        테이블 그리기
      </button>
      <button
        type="button"
        className="rounded border px-3 py-2 aria-pressed:bg-slate-900 aria-pressed:text-white"
        aria-pressed={mode === 'pan'}
        onClick={() => setMode('pan')}
      >
        화면 이동
      </button>
    </div>
  )
}
