import { useId, useRef, useState } from 'react'
import { useErdEditorStore } from '@/entities/erd/model'
import { validateNameEdit } from '@/entities/erd/model/name-edit'
import { cn } from '@/shared/lib/cn'

export function ErdNameInput({
  tableId,
  columnId,
  field,
  label,
  dark = false,
  disabled = false,
  editOnDoubleClick = false,
}: {
  tableId: string
  columnId?: string
  field: 'logicalName' | 'physicalName'
  label: string
  dark?: boolean
  disabled?: boolean
  editOnDoubleClick?: boolean
}) {
  const project = useErdEditorStore((state) => state.project)
  const table = project.tables.find((table) => table.id === tableId)
  const item = columnId ? table?.columns.find((column) => column.id === columnId) : table
  const value = item?.[field] ?? ''
  const [draft, setDraft] = useState({ base: value, value, error: '' })
  const composing = useRef(false)
  const [active, setActive] = useState(false)
  const id = useId()
  const current = draft.base === value ? draft : { base: value, value, error: '' }
  const change = (next: string, composition = false) => {
    if (composition) {
      setDraft({ base: value, value: next, error: '' })
      return
    }
    const state = useErdEditorStore.getState()
    const error = validateNameEdit(state.project, tableId, columnId, field, next)
    if (error) {
      setDraft({ base: value, value: next, error })
      return
    }
    const normalized = next.trim()
    setDraft({ base: normalized, value: next, error: '' })
    const update =
      field === 'logicalName'
        ? { logicalName: normalized || undefined }
        : { physicalName: normalized }
    if (columnId) state.updateColumn(tableId, columnId, update)
    else state.updateTable(tableId, update)
  }
  const finish = () => {
    composing.current = false
    setDraft({ base: value, value, error: '' })
    setActive(false)
  }
  const begin = () => {
    setDraft({ base: value, value, error: '' })
    setActive(true)
  }
  if (editOnDoubleClick && (!active || disabled)) {
    return (
      <button
        type="button"
        aria-label={label}
        title={`${label} · 더블클릭하여 편집`}
        disabled={disabled}
        className="nodrag nopan block min-h-8 w-full cursor-default truncate rounded px-1 py-1 text-left text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-teal-400"
        onClick={() => useErdEditorStore.getState().selectTable(tableId)}
        onDoubleClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          begin()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'F2') {
            event.preventDefault()
            event.stopPropagation()
            useErdEditorStore.getState().selectTable(tableId)
            begin()
          }
        }}
      >
        {value || '—'}
      </button>
    )
  }
  return (
    <div className="min-w-0">
      <input
        id={id}
        aria-label={label}
        aria-invalid={!!current.error}
        aria-describedby={current.error ? `${id}-error` : undefined}
        className={cn(
          'nodrag nopan nowheel w-full min-w-0 rounded border border-transparent px-1 py-1 text-sm outline-none focus:border-teal-400',
          dark
            ? 'bg-transparent text-slate-100 placeholder:text-slate-500'
            : 'border-zinc-300 bg-white text-zinc-950',
          current.error && 'border-red-400',
        )}
        placeholder={field === 'logicalName' ? '논리명 입력' : '물리명 입력'}
        disabled={disabled}
        autoFocus={editOnDoubleClick}
        value={current.value}
        onBlur={() => {
          if (editOnDoubleClick) finish()
        }}
        onChange={(event) => change(event.target.value, composing.current)}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={(event) => {
          composing.current = false
          change(event.currentTarget.value)
        }}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (composing.current || event.nativeEvent.isComposing) return
          if (event.key === 'Escape') {
            finish()
          } else if (editOnDoubleClick && event.key === 'Enter') {
            event.preventDefault()
            finish()
          }
        }}
      />
      {current.error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={cn('text-xs', dark ? 'text-red-300' : 'text-red-700')}
        >
          {current.error}
        </p>
      )}
    </div>
  )
}
