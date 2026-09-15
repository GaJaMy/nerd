import { Table2 } from 'lucide-react'
import type { DisplayOptions, ErdTable, ErdKey, ErdRelation } from '@/entities/erd/model'
import { cn } from '@/shared/lib/cn'

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
  const title = getTableTitle(table, displayOptions)
  const secondaryName =
    displayOptions.showPhysicalName && table.logicalName ? table.physicalName : null

  return (
    <article
      aria-label={`테이블 ${table.physicalName}`}
      className={cn(
        'w-64 overflow-hidden rounded-md border bg-white text-left shadow-sm transition',
        selected
          ? 'border-teal-600 ring-2 shadow-teal-900/10 ring-teal-600/20'
          : 'border-zinc-300',
      )}
      data-testid={`erd-table-node-${table.physicalName}`}
    >
      <header className="flex items-start gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
          <Table2 aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-950">
            {title}
          </span>
          {secondaryName ? (
            <span className="block truncate text-xs text-zinc-500">{secondaryName}</span>
          ) : null}
        </span>
      </header>

      <div className="space-y-2 px-3 py-2">
        {table.comment && displayOptions.showComment ? (
          <p className="line-clamp-2 text-xs text-zinc-500">{table.comment}</p>
        ) : null}

        {table.columns.length > 0 ? (
          <ul className="divide-y divide-zinc-100">
            {table.columns.map((column) => (
              <li className="flex min-h-8 items-center gap-2 py-1.5" key={column.id}>
                {keys
                  .filter(
                    (key) =>
                      key.tableId === table.id &&
                      key.type === 'primary' &&
                      key.columnIds.includes(column.id),
                  )
                  .map((key) => (
                    <span key={key.id} className="text-xs font-semibold text-teal-700">
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
                    <span key={relation.id} className="text-xs text-indigo-700">
                      FK{' '}
                      {[...relation.columnMappings]
                        .sort((a, b) => a.ordinal - b.ordinal)
                        .findIndex((mapping) => mapping.sourceColumnId === column.id) + 1}
                    </span>
                  ))}
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700">
                  {getColumnTitle(column, displayOptions)}
                </span>
                {displayOptions.showDataType ? (
                  <span className="shrink-0 text-[11px] text-zinc-500">
                    {column.dataType.name}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500">컬럼 0개</p>
        )}
      </div>
    </article>
  )
}

function getTableTitle(table: ErdTable, displayOptions: DisplayOptions) {
  if (displayOptions.showLogicalName && table.logicalName) {
    return table.logicalName
  }

  return table.physicalName
}

function getColumnTitle(
  column: ErdTable['columns'][number],
  displayOptions: DisplayOptions,
) {
  if (displayOptions.showLogicalName && column.logicalName) {
    return column.logicalName
  }

  return column.physicalName
}
