import { useState } from 'react'
import { useErdEditorStore } from '@/entities/erd/model'

export function ErdNavigation({ onFocus }: { onFocus: (tableId: string) => void }) {
  const store = useErdEditorStore()
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLocaleLowerCase()
  const tables = store.project.tables.filter((table) =>
    [table.physicalName, table.logicalName ?? ''].some((name) =>
      name.toLocaleLowerCase().includes(normalized),
    ),
  )
  return (
    <section className="space-y-3" aria-label="테이블 검색 목록">
      <label className="block font-semibold">
        테이블 검색
        <input
          className="mt-1 block w-full rounded border p-2 font-normal"
          placeholder="물리명 또는 논리명"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="max-h-48 space-y-1 overflow-y-auto">
        {tables.map((table) => (
          <li key={table.id} className="flex items-center gap-2">
            <button
              className="min-w-0 flex-1 truncate rounded border p-2 text-left"
              type="button"
              onClick={() => {
                store.setTableHidden(table.id, false)
                store.selectTable(table.id)
                onFocus(table.id)
              }}
            >
              {table.physicalName}
              {table.logicalName ? ` · ${table.logicalName}` : ''}
              {table.hidden ? ' (숨김)' : ''}
            </button>
            <button
              className="shrink-0 rounded border p-2 text-xs"
              type="button"
              aria-label={`${table.physicalName} ${table.hidden ? '표시' : '숨기기'}`}
              onClick={() => store.setTableHidden(table.id, !table.hidden)}
            >
              {table.hidden ? '표시' : '숨기기'}
            </button>
          </li>
        ))}
      </ul>
      {!tables.length && <p className="text-sm text-zinc-500">검색 결과가 없습니다.</p>}
    </section>
  )
}
