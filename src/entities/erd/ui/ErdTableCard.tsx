import type { DisplayOptions, ErdTable, ErdKey, ErdRelation } from '@/entities/erd/model'
import { cn } from '@/shared/lib/cn'
import { useErdEditorStore } from '@/entities/erd/model'
import { ErdNameInput } from './ErdNameInput'
import { formatMysqlType } from '@/entities/erd/model/mysql-ddl'

type ErdTableCardProps = {
  displayOptions: DisplayOptions
  selected?: boolean
  table: ErdTable
  keys?: ErdKey[]
  relations?: ErdRelation[]
}

export function ErdTableCard({
  displayOptions,
  selected = false,
  table,
  keys = [],
  relations = [],
}: ErdTableCardProps) {
  const addColumn = useErdEditorStore((state) => state.addColumn)
  const showLogical = displayOptions.showLogicalName
  const showPhysical = displayOptions.showPhysicalName || !showLogical
  const nameColumns = showLogical && showPhysical ? 'grid-cols-2' : 'grid-cols-1'
  return (
    <article
      aria-label={`테이블 ${table.physicalName}`}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-slate-900 text-left text-slate-100 shadow-lg',
        selected ? 'border-teal-400 ring-2 ring-teal-400/30' : 'border-slate-600',
      )}
      style={{ width: table.size?.width ?? 360, minHeight: table.size?.height ?? 140 }}
      data-testid={`erd-table-node-${table.physicalName}`}
    >
      <header className={cn('grid border-b border-slate-600 bg-slate-800', nameColumns)}>
        {showLogical && (
          <div className="min-w-0 p-3">
            <span className="mb-1 block text-xs text-slate-400">논리명</span>
            <ErdNameInput
              tableId={table.id}
              field="logicalName"
              label="캔버스 테이블 논리명"
              dark
            />
          </div>
        )}
        {showPhysical && (
          <div className="min-w-0 p-3">
            <span className="mb-1 block text-xs text-slate-400">물리명</span>
            <ErdNameInput
              tableId={table.id}
              field="physicalName"
              label="캔버스 테이블 물리명"
              dark
            />
          </div>
        )}
      </header>
      {table.comment && displayOptions.showComment && (
        <p className="px-3 py-2 text-xs text-slate-400">{table.comment}</p>
      )}
      <div
        className={cn(
          'grid border-b border-slate-700 px-3 py-2 text-xs text-slate-400',
          nameColumns,
        )}
      >
        {showLogical && <span>컬럼 논리명</span>}
        {showPhysical && <span>컬럼 물리명</span>}
      </div>
      <ul className="divide-y divide-slate-700">
        {table.columns.map((column) => (
          <li className="space-y-1 px-3 py-2" key={column.id}>
            <div className={cn('grid gap-3 text-sm', nameColumns)}>
              {showLogical && (
                <ErdNameInput
                  tableId={table.id}
                  columnId={column.id}
                  field="logicalName"
                  label="캔버스 컬럼 논리명"
                  dark
                />
              )}
              {showPhysical && (
                <ErdNameInput
                  tableId={table.id}
                  columnId={column.id}
                  field="physicalName"
                  label="캔버스 컬럼 물리명"
                  dark
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {keys
                .filter(
                  (key) =>
                    key.tableId === table.id &&
                    key.type === 'primary' &&
                    key.columnIds.includes(column.id),
                )
                .map((key) => (
                  <span key={key.id} className="text-teal-300">
                    PK {key.columnIds.indexOf(column.id) + 1}
                  </span>
                ))}
              {relations
                .filter(
                  (relation) =>
                    relation.sourceTableId === table.id &&
                    relation.columnMappings.some(
                      (mapping) => mapping.sourceColumnId === column.id,
                    ),
                )
                .map((relation) => (
                  <span key={relation.id} className="text-indigo-300">
                    FK{' '}
                    {[...relation.columnMappings]
                      .sort((a, b) => a.ordinal - b.ordinal)
                      .findIndex((mapping) => mapping.sourceColumnId === column.id) + 1}
                  </span>
                ))}
              {displayOptions.showDataType && (
                <span className="text-slate-400">{formatMysqlType(column.dataType)}</span>
              )}
            </div>
            {displayOptions.showComment && column.comment && (
              <p className="text-xs text-slate-400">{column.comment}</p>
            )}
          </li>
        ))}
      </ul>
      {!table.columns.length && <p className="p-3 text-xs text-slate-400">컬럼 0개</p>}
      <div
        className="group/add-column mt-auto border-t border-slate-700 px-3 py-2"
        data-testid="column-add-area"
      >
        <button
          type="button"
          aria-label="컬럼 추가"
          className="nodrag nopan flex h-8 w-full items-center justify-center rounded border border-dashed border-teal-400/60 text-xl text-teal-300 opacity-0 transition-opacity group-focus-within/add-column:opacity-100 group-hover/add-column:opacity-100 focus:opacity-100 focus:outline-2 focus:outline-teal-300 [@media(hover:none)]:opacity-100"
          onClick={(event) => {
            event.stopPropagation()
            addColumn(table.id)
          }}
        >
          +
        </button>
      </div>
    </article>
  )
}
