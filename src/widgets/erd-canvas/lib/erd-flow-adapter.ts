import type { Edge, Node } from '@xyflow/react'
import type { DisplayOptions, ErdKey, ErdRelation, ErdTable } from '@/entities/erd/model'

type ErdTableNodeData = {
  displayOptions: DisplayOptions
  table: ErdTable
  keys: ErdKey[]
  relations: ErdRelation[]
}

export type ErdTableFlowNode = Node<ErdTableNodeData, 'erdTable'>

export function toErdTableFlowNodes({
  displayOptions,
  selectedTableId,
  tables,
  keys = [],
  relations = [],
}: {
  displayOptions: DisplayOptions
  selectedTableId: string | null
  tables: ErdTable[]
  keys?: ErdKey[]
  relations?: ErdRelation[]
}): ErdTableFlowNode[] {
  return tables
    .filter((table) => !table.hidden)
    .map((table) => ({
      data: {
        displayOptions,
        table,
        keys,
        relations,
      },
      id: table.id,
      position: table.position,
      selected: table.id === selectedTableId,
      type: 'erdTable',
    }))
}

export function toErdRelationFlowEdges(
  tables: ErdTable[],
  relations: ErdRelation[],
  selectedId: string | null,
): Edge[] {
  const visible = new Set(
    tables.filter((table) => !table.hidden).map((table) => table.id),
  )
  return relations
    .filter(
      (relation) =>
        !relation.hidden &&
        visible.has(relation.sourceTableId) &&
        visible.has(relation.targetTableId),
    )
    .map((relation) => {
      const source = tables.find((table) => table.id === relation.sourceTableId)
      const target = tables.find((table) => table.id === relation.targetTableId)
      const mappings = [...relation.columnMappings]
        .sort((a, b) => a.ordinal - b.ordinal)
        .map(
          (mapping) =>
            `${source?.columns.find((column) => column.id === mapping.sourceColumnId)?.physicalName} → ${target?.columns.find((column) => column.id === mapping.targetColumnId)?.physicalName}`,
        )
        .join(', ')
      const cardinality = relation.cardinality === 'one-to-one' ? '1:1' : 'N:1'
      const label = `${cardinality}${relation.columnMappings.length > 1 ? ` · ${relation.columnMappings.length}열` : ''}`
      const self = source?.id === target?.id
      const pointsLeft = (source?.position.x ?? 0) > (target?.position.x ?? 0)
      return {
        id: relation.id,
        source: relation.sourceTableId,
        target: relation.targetTableId,
        sourceHandle: pointsLeft && !self ? 'source-left' : 'source-right',
        targetHandle: pointsLeft || self ? 'target-right' : 'target-left',
        label,
        ariaLabel: `${relation.label ?? '관계'} · ${cardinality} · ${mappings}`,
        selected: relation.id === selectedId,
        type: self ? 'selfRelation' : 'smoothstep',
        labelStyle: { fontSize: 11, fontWeight: 600 },
        style: {
          stroke: relation.id === selectedId ? '#2dd4bf' : '#94a3b8',
          strokeWidth: 2,
        },
      }
    })
}
