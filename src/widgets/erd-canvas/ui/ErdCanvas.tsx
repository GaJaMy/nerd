import { useCallback, useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import type { CanvasPosition, DisplayOptions, ErdTable } from '@/entities/erd/model'
import { ErdTableCard } from '@/entities/erd/ui'
import { toErdTableFlowNodes, type ErdTableFlowNode } from '../lib/erd-flow-adapter'

type ErdCanvasProps = {
  displayOptions: DisplayOptions
  onSelectTable: (tableId: string | null) => void
  onTablePositionChange: (tableId: string, position: CanvasPosition) => void
  selectedTableId: string | null
  tables: ErdTable[]
}

const nodeTypes = {
  erdTable: ErdTableNode,
} satisfies NodeTypes

export function ErdCanvas({
  displayOptions,
  onSelectTable,
  onTablePositionChange,
  selectedTableId,
  tables,
}: ErdCanvasProps) {
  const nodes = useMemo(
    () => toErdTableFlowNodes({ displayOptions, selectedTableId, tables }),
    [displayOptions, selectedTableId, tables],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<ErdTableFlowNode>[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          onTablePositionChange(change.id, change.position)
        }
      })
    },
    [onTablePositionChange],
  )

  return (
    <section
      aria-label="ERD 캔버스"
      className="relative min-h-0 flex-1 overflow-hidden border border-zinc-200 bg-white"
      data-testid="erd-canvas"
    >
      {tables.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-md border border-dashed border-zinc-300 bg-white/90 px-5 py-4 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-800">테이블이 없습니다</p>
            <p className="mt-1 text-xs text-zinc-500">상단에서 새 테이블을 추가하세요</p>
          </div>
        </div>
      ) : null}

      <ReactFlow
        colorMode="light"
        edges={[]}
        fitView
        maxZoom={1.6}
        minZoom={0.35}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          onSelectTable(node.id)
        }}
        onNodesChange={handleNodesChange}
        onPaneClick={() => {
          onSelectTable(null)
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d4d4d8" gap={24} size={1} variant={BackgroundVariant.Dots} />
        <MiniMap pannable position="bottom-left" zoomable />
        <Controls position="bottom-right" />
      </ReactFlow>
    </section>
  )
}

function ErdTableNode({ data, selected }: NodeProps<ErdTableFlowNode>) {
  return (
    <ErdTableCard
      displayOptions={data.displayOptions}
      selected={selected}
      table={data.table}
    />
  )
}
