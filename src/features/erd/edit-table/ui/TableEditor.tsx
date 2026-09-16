import { useErdEditorStore, type ErdTable } from '@/entities/erd/model'
import { ErdNameInput } from '@/entities/erd/ui/ErdNameInput'

export function TableEditor({ table }: { table: ErdTable }) {
  const updateTable = useErdEditorStore((state) => state.updateTable)
  const deleteTable = useErdEditorStore((state) => state.deleteTable)
  const display = useErdEditorStore((state) => state.project.displayOptions)
  return (
    <section className="space-y-3" aria-label="테이블 편집">
      <h2 className="font-semibold">선택된 테이블</h2>
      {display.showPhysicalName && (
        <div>
          테이블 물리명
          <ErdNameInput tableId={table.id} field="physicalName" label="테이블 물리명" />
        </div>
      )}
      {display.showLogicalName && (
        <div>
          테이블 논리명
          <ErdNameInput tableId={table.id} field="logicalName" label="테이블 논리명" />
        </div>
      )}
      <label className="block">
        테이블 코멘트
        <textarea
          className="block w-full rounded border p-2"
          value={table.comment ?? ''}
          onChange={(event) => updateTable(table.id, { comment: event.target.value })}
        />
      </label>
      <p className="text-xs text-zinc-500">유효한 입력은 즉시 반영됩니다.</p>
      <button
        className="rounded border px-3 py-2 text-red-700"
        type="button"
        onClick={() => {
          if (window.confirm('테이블과 연결된 키·관계를 삭제할까요?'))
            deleteTable(table.id)
        }}
      >
        테이블 삭제
      </button>
    </section>
  )
}
