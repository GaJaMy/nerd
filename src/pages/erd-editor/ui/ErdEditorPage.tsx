import { TableEditor } from '@/features/erd/edit-table/ui/TableEditor'
import { Plus, Table2 } from 'lucide-react'
import { useState } from 'react'
import { ErdNavigation } from '@/widgets/erd-navigation/ui/ErdNavigation'
import { RelationEditor } from '@/features/erd/edit-relation/ui/RelationEditor'
import { ColumnEditor } from '@/features/erd/edit-columns/ui/ColumnEditor'
import { KeyEditor } from '@/features/erd/edit-key/ui/KeyEditor'
import { ErdCanvas } from '@/widgets/erd-canvas'
import { useErdEditorStore } from '@/entities/erd/model'

export function ErdEditorPage() {
  const [focusRequest, setFocusRequest] = useState<{
    tableId: string
    sequence: number
  } | null>(null)
  const project = useErdEditorStore((state) => state.project)
  const selectedTableId = useErdEditorStore((state) => state.selectedTableId)
  const addTable = useErdEditorStore((state) => state.addTable)
  const moveTable = useErdEditorStore((state) => state.moveTable)
  const selectTable = useErdEditorStore((state) => state.selectTable)
  const selectedTable =
    project.tables.find((table) => table.id === selectedTableId) ?? null

  return (
    <main className="flex h-[calc(100svh-65px)] min-h-[600px] flex-col bg-zinc-100">
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-zinc-950">ERD 편집기</h1>
            <p className="text-sm text-zinc-500">{project.name}</p>
          </div>

          <button
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800 focus:ring-2 focus:ring-teal-600/25 focus:outline-none"
            onClick={() => {
              addTable()
            }}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            <span>테이블 추가</span>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(300px,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1">
          <ErdCanvas
            displayOptions={project.displayOptions}
            onSelectTable={selectTable}
            onTablePositionChange={moveTable}
            selectedTableId={selectedTableId}
            tables={project.tables}
            focusRequest={focusRequest}
          />

          <aside
            aria-label="ERD 보조 패널"
            className="overflow-y-auto border-t border-zinc-200 bg-white p-4 lg:border-t-0 lg:border-l"
          >
            <section className="space-y-4">
              <ErdNavigation
                onFocus={(tableId) =>
                  setFocusRequest((previous) => ({
                    tableId,
                    sequence: (previous?.sequence ?? 0) + 1,
                  }))
                }
              />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
                  <Table2 aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">테이블</h2>
                  <p className="text-sm text-zinc-500">
                    테이블 {project.tables.length}개
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-zinc-200 p-3">
                <h2 className="text-sm font-semibold text-zinc-950">선택된 테이블</h2>
                {selectedTable ? (
                  <div className="space-y-5">
                    <TableEditor key={selectedTable.id} table={selectedTable} />
                    <ColumnEditor
                      key={`columns-${selectedTable.id}`}
                      table={selectedTable}
                    />
                    <KeyEditor
                      key={`${selectedTable.id}-${selectedTable.columns.map((column) => column.id).join(',')}`}
                      table={selectedTable}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">선택 없음</p>
                )}
              </div>
              <RelationEditor />
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
