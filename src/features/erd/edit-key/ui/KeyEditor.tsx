import { useState } from 'react'
import { useErdEditorStore, type ErdTable } from '@/entities/erd/model'

export function KeyEditor({ table }: { table: ErdTable }) {
  const store = useErdEditorStore()
  const primary = store.project.keys.find(
    (key) => key.tableId === table.id && key.type === 'primary',
  )
  const [columnIds, setColumnIds] = useState(primary?.columnIds ?? [])
  return (
    <section className="space-y-2 rounded border p-3" aria-label="기본키 설정">
      <h2 className="font-semibold">기본키 (PK)</h2>
      <p className="text-xs text-zinc-600">체크한 순서대로 복합키를 구성합니다.</p>
      {table.columns.map((column) => (
        <label className="block" key={column.id}>
          <input
            type="checkbox"
            checked={columnIds.includes(column.id)}
            disabled={column.dataType.name === 'TEXT'}
            onChange={(event) =>
              setColumnIds(
                event.target.checked
                  ? [...columnIds, column.id]
                  : columnIds.filter((id) => id !== column.id),
              )
            }
          />{' '}
          {column.physicalName}
          {columnIds.includes(column.id)
            ? ` · PK ${columnIds.indexOf(column.id) + 1}`
            : ''}
        </label>
      ))}
      <button
        type="button"
        className="rounded border px-3 py-2"
        onClick={() => {
          const validIds = columnIds.filter((id) =>
            table.columns.some((column) => column.id === id),
          )
          if (validIds.length)
            store.upsertKey({
              ...(primary ? { id: primary.id } : {}),
              tableId: table.id,
              type: 'primary',
              columnIds: validIds,
            })
          else if (primary) store.deleteKey(primary.id)
        }}
      >
        기본키 적용
      </button>
    </section>
  )
}
