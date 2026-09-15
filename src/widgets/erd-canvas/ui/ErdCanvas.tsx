import { useCallback, useMemo, useEffect, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  BaseEdge,
  Handle,
  Position,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useNodesInitialized,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
  type EdgeProps,
} from '@xyflow/react'
import type { CanvasPosition, DisplayOptions, ErdTable } from '@/entities/erd/model'
import { useErdEditorStore } from '@/entities/erd/model'
import { ErdTableCard } from '@/entities/erd/ui'
import {
  toErdTableFlowNodes,
  toErdRelationFlowEdges,
  type ErdTableFlowNode,
} from '../lib/erd-flow-adapter'

type ErdCanvasProps = {
  displayOptions: DisplayOptions
  onSelectTable: (tableId: string | null) => void
  onTablePositionChange: (tableId: string, position: CanvasPosition) => void
  selectedTableId: string | null
  tables: ErdTable[]
  focusRequest?: { tableId: string; sequence: number } | null
}

const nodeTypes = {
  erdTable: ErdTableNode,
} satisfies NodeTypes

const edgeTypes = { selfRelation: SelfRelationEdge }

function SelfRelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  style,
}: EdgeProps) {
  return (
    <BaseEdge
      id={id}
      path={`M ${sourceX} ${sourceY} C ${sourceX + 140} ${sourceY + 80}, ${targetX + 140} ${targetY - 80}, ${targetX} ${targetY}`}
      label={label}
      labelX={sourceX + 110}
      labelY={(sourceY + targetY) / 2}
      style={style}
    />
  )
}

export function ErdCanvas(props: ErdCanvasProps) {
  return (
    <ReactFlowProvider>
      <ErdCanvasContent {...props} />
    </ReactFlowProvider>
  )
}

function ErdCanvasContent({
  displayOptions,
  onSelectTable,
  onTablePositionChange,
  selectedTableId,
  tables,
  focusRequest,
}: ErdCanvasProps) {
  const [measurements, setMeasurements] = useState<
    Record<string, { width: number; height: number }>
  >({})
  const viewport = useErdEditorStore((state) => state.project.viewport)
  const setViewport = useErdEditorStore((state) => state.setViewport)
  const { fitView } = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  useEffect(() => {
    if (focusRequest && nodesInitialized)
      void fitView({ nodes: [{ id: focusRequest.tableId }], padding: 0.5, maxZoom: 1 })
  }, [focusRequest, nodesInitialized, fitView])
  const keys = useErdEditorStore((state) => state.project.keys)
  const relations = useErdEditorStore((state) => state.project.relations)
  const selectedRelationId = useErdEditorStore((state) => state.selectedRelationId)
  const selectRelation = useErdEditorStore((state) => state.selectRelation)
  const nodes = useMemo(
    () =>
      toErdTableFlowNodes({
        displayOptions,
        selectedTableId,
        tables,
        keys,
        relations,
      }).map((node) => ({
        ...node,
        ...(measurements[node.id] ? { measured: measurements[node.id] } : {}),
      })),
    [displayOptions, selectedTableId, tables, keys, relations, measurements],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<ErdTableFlowNode>[]) => {
      changes.forEach((change) => {
        if (change.type === 'dimensions' && change.dimensions) {
          const dimensions = change.dimensions
          setMeasurements((previous) =>
            previous[change.id]?.width === dimensions.width &&
            previous[change.id]?.height === dimensions.height
              ? previous
              : { ...previous, [change.id]: dimensions },
          )
        }
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
        edges={toErdRelationFlowEdges(tables, relations, selectedRelationId)}
        edgeTypes={edgeTypes}
        onEdgeClick={(_, edge) => selectRelation(edge.id)}
        nodesConnectable={false}
        deleteKeyCode={null}
        viewport={viewport}
        onViewportChange={setViewport}
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
        <MiniMap className="hidden lg:block" pannable position="bottom-left" zoomable />
        <Controls position="bottom-right" />
      </ReactFlow>
    </section>
  )
}

function ErdTableNode({ data, selected }: NodeProps<ErdTableFlowNode>) {
  return (
    <>
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        style={{ top: '35%' }}
      />
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        style={{ top: '35%' }}
      />
      <ErdTableCard
        displayOptions={data.displayOptions}
        selected={selected}
        table={data.table}
        keys={data.keys}
        relations={data.relations}
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        style={{ top: '65%' }}
      />
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        style={{ top: '65%' }}
      />
    </>
  )
}
