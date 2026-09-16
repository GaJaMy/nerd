import { useErdEditorStore, type ErdTable } from '@/entities/erd/model'
import { displayName } from './display-name'

export function TableKeyDetails({ table }: { table: ErdTable }) {
  const { project } = useErdEditorStore()
  const options = project.displayOptions
  const primary = project.keys.find(
    (key) => key.tableId === table.id && key.type === 'primary',
  )
  const relations = project.relations.filter(
    (relation) =>
      relation.sourceTableId === table.id || relation.targetTableId === table.id,
  )
  return (
    <section
      aria-label="적용된 키 정보"
      className="space-y-3 rounded border border-teal-200 bg-teal-50 p-3 text-sm"
    >
      <h2 className="font-semibold">적용된 키 정보</h2>
      <p>{!primary ? 'PK 없음' : primary.columnIds.length > 1 ? '복합 PK' : '단일 PK'}</p>
      <ol>
        {primary?.columnIds.map((id, index) => (
          <li key={id}>
            PK {index + 1} ·{' '}
            {displayName(
              table.columns.find((column) => column.id === id),
              options,
            )}
          </li>
        ))}
      </ol>
      {!relations.length && <p className="text-zinc-500">연결된 FK 없음</p>}
      {relations.map((relation) => {
        const source = project.tables.find((item) => item.id === relation.sourceTableId)
        const target = project.tables.find((item) => item.id === relation.targetTableId)
        return (
          <div key={relation.id} className="space-y-1 border-t border-teal-200 pt-2">
            <p>
              {relation.columnMappings.length > 1 ? '복합 FK' : 'FK'} ·{' '}
              {relation.cardinality === 'one-to-one' ? '1:1' : 'N:1'}
            </p>
            <p>
              {displayName(source, options)} → {displayName(target, options)}
            </p>
            {[...relation.columnMappings]
              .sort((a, b) => a.ordinal - b.ordinal)
              .map((mapping) => (
                <p key={mapping.targetColumnId}>
                  {displayName(
                    source?.columns.find(
                      (column) => column.id === mapping.sourceColumnId,
                    ),
                    options,
                  )}{' '}
                  →{' '}
                  {displayName(
                    target?.columns.find(
                      (column) => column.id === mapping.targetColumnId,
                    ),
                    options,
                  )}
                </p>
              ))}
          </div>
        )
      })}
    </section>
  )
}
