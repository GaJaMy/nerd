import { useState } from 'react'
import { X } from 'lucide-react'
import { CanvasTools } from '@/features/erd/canvas-interaction/ui/CanvasTools'
import { useCanvasInteractionStore } from '@/features/erd/canvas-interaction/model/use-canvas-interaction-store'
import { TableEditor } from '@/features/erd/edit-table/ui/TableEditor'
import { ErdValidation } from '@/widgets/erd-validation/ui/ErdValidation'
import { DdlExport } from '@/features/erd/export-ddl/ui/DdlExport'
import { ErdNavigation } from '@/widgets/erd-navigation/ui/ErdNavigation'
import { RelationEditor } from '@/features/erd/edit-relation/ui/RelationEditor'
import { ColumnEditor } from '@/features/erd/edit-columns/ui/ColumnEditor'
import { KeyEditor } from '@/features/erd/edit-key/ui/KeyEditor'
import { ErdCanvas } from '@/widgets/erd-canvas'
import { useErdEditorStore } from '@/entities/erd/model'
import { TableKeyDetails } from '@/entities/erd/ui/TableKeyDetails'

export function ErdEditorPage() {
  const [focusRequest, setFocusRequest] = useState<{
    tableId: string
    sequence: number
  } | null>(null)
  const { project, selectedTableId, moveTable, selectTable } = useErdEditorStore()
  const { mode, toolPanel, setToolPanel, cancelRelation } = useCanvasInteractionStore()
  const selectedTable = project.tables.find((table) => table.id === selectedTableId)
  return (
    <main className="flex h-[calc(100svh-65px)] min-h-[600px] flex-col bg-zinc-100">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">ERD 편집기</h1>
          <p className="text-sm text-zinc-500">{project.name}</p>
        </div>
        <span className="text-sm text-zinc-500">테이블 {project.tables.length}개</span>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <CanvasTools />
        {toolPanel && (
          <aside
            aria-label="도구 보조 패널"
            hidden={mode === 'relation'}
            className="absolute top-0 bottom-0 left-14 z-20 w-[min(320px,calc(100%-56px))] overflow-y-auto border-r border-zinc-200 bg-white p-4 shadow-xl"
          >
            <button
              type="button"
              aria-label="도구 패널 닫기"
              title="도구 패널 닫기"
              className="mb-3 ml-auto flex h-8 w-8 items-center justify-center rounded hover:bg-zinc-100"
              onClick={() => {
                cancelRelation()
                setToolPanel(null)
              }}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
            {toolPanel === 'search' && (
              <ErdNavigation
                onFocus={(tableId) => {
                  setFocusRequest((previous) => ({
                    tableId,
                    sequence: (previous?.sequence ?? 0) + 1,
                  }))
                  setToolPanel(null)
                }}
              />
            )}
            {toolPanel === 'relation' && <RelationEditor />}
            {toolPanel === 'ddl' && <DdlExport />}
            {toolPanel === 'validation' && <ErdValidation />}
          </aside>
        )}
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(300px,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1">
          <ErdCanvas
            displayOptions={project.displayOptions}
            onSelectTable={selectTable}
            onTablePositionChange={moveTable}
            selectedTableId={selectedTableId}
            tables={project.tables}
            focusRequest={focusRequest}
          />
          <aside
            aria-label="테이블 상세 패널"
            className="space-y-4 overflow-y-auto border-t border-zinc-200 bg-white p-4 lg:border-t-0 lg:border-l"
          >
            <h2 className="font-semibold">테이블 상세</h2>
            {selectedTable ? (
              <>
                <TableEditor key={selectedTable.id} table={selectedTable} />
                <p className="text-sm text-zinc-500">
                  컬럼 {selectedTable.columns.length}개
                </p>
                <TableKeyDetails table={selectedTable} />
                <KeyEditor
                  key={`${selectedTable.id}-${selectedTable.columns.map((column) => column.id).join(',')}`}
                  table={selectedTable}
                />
                <ColumnEditor key={`columns-${selectedTable.id}`} table={selectedTable} />
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                선택 없음 · 캔버스에서 테이블을 클릭하세요.
              </p>
            )}
            <p className="text-xs text-zinc-500">
              작업은 현재 화면에서만 유지됩니다. 새로고침하면 초기화됩니다.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
