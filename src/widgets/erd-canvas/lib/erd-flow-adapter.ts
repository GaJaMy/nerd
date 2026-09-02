import type { Node } from '@xyflow/react'
import type { DisplayOptions, ErdTable } from '@/entities/erd/model'

export type ErdTableNodeData = {
  displayOptions: DisplayOptions
  table: ErdTable
}

export type ErdTableFlowNode = Node<ErdTableNodeData, 'erdTable'>

export function toErdTableFlowNodes({
  displayOptions,
  selectedTableId,
  tables,
}: {
  displayOptions: DisplayOptions
  selectedTableId: string | null
  tables: ErdTable[]
}): ErdTableFlowNode[] {
  return tables
    .filter((table) => !table.hidden)
    .map((table) => ({
      data: {
        displayOptions,
        table,
      },
      id: table.id,
      position: table.position,
      selected: table.id === selectedTableId,
      type: 'erdTable',
    }))
}
