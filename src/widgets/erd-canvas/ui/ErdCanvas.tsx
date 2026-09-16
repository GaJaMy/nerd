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
import { useCanvasInteractionStore } from '@/features/erd/canvas-interaction/model/use-canvas-interaction-store'
import { getDrawnTable } from '../lib/draw-table'
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
  const mode = useCanvasInteractionStore((state) => state.mode)
  const relationDraft = useCanvasInteractionStore((state) => state.relationDraft)
  const addTable = useErdEditorStore((state) => state.addTable)
  const [drawing, setDrawing] = useState<{
    start: CanvasPosition
    end: CanvasPosition
    pointerId: number
  } | null>(null)
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawing(null)
        if (useCanvasInteractionStore.getState().relationDraft)
          useCanvasInteractionStore.getState().cancelRelation()
      }
    }
    window.addEventListener('keydown', cancel)
    const unsubscribe = useCanvasInteractionStore.subscribe(() => setDrawing(null))
    return () => {
      window.removeEventListener('keydown', cancel)
      unsubscribe()
    }
  }, [])
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
      className="relative min-h-0 flex-1 overflow-hidden border border-slate-700 bg-slate-950"
      data-testid="erd-canvas"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDownCapture={(event) => {
        if (
          mode !== 'draw' ||
          event.button !== 0 ||
          !(event.target instanceof Element) ||
          !event.target.classList.contains('react-flow__pane')
        )
          return
        event.preventDefault()
        event.stopPropagation()
        const rect = event.currentTarget.getBoundingClientRect()
        const point = {
          x: event.clientX - rect.left - event.currentTarget.clientLeft,
          y: event.clientY - rect.top - event.currentTarget.clientTop,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        setDrawing({ start: point, end: point, pointerId: event.pointerId })
      }}
      onPointerMove={(event) => {
        if (!drawing || drawing.pointerId !== event.pointerId) return
        const rect = event.currentTarget.getBoundingClientRect()
        setDrawing({
          ...drawing,
          end: {
            x: event.clientX - rect.left - event.currentTarget.clientLeft,
            y: event.clientY - rect.top - event.currentTarget.clientTop,
          },
        })
      }}
      onPointerUp={(event) => {
        if (!drawing || drawing.pointerId !== event.pointerId) return
        const rect = event.currentTarget.getBoundingClientRect()
        const result = getDrawnTable(
          drawing.start,
          {
            x: event.clientX - rect.left - event.currentTarget.clientLeft,
            y: event.clientY - rect.top - event.currentTarget.clientTop,
          },
          viewport,
        )
        setDrawing(null)
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
        if (result && mode === 'draw') addTable(result)
      }}
      onPointerCancel={() => setDrawing(null)}
      onLostPointerCapture={() => setDrawing(null)}
    >
      {tables.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-md border border-dashed border-slate-600 bg-slate-900/90 px-5 py-4 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-100">테이블이 없습니다</p>
            <p className="mt-1 text-xs text-slate-400">
              빈 공간을 드래그해 테이블을 그리세요
            </p>
          </div>
        </div>
      ) : null}

      <ReactFlow
        panOnDrag={mode === 'pan' ? true : [1, 2]}
        nodesDraggable={mode !== 'relation'}
        selectionOnDrag={false}
        colorMode="dark"
        edges={toErdRelationFlowEdges(tables, relations, selectedRelationId)}
        edgeTypes={edgeTypes}
        onEdgeClick={(_, edge) => {
          if (mode === 'relation') return
          useCanvasInteractionStore.getState().cancelRelation()
          selectRelation(edge.id)
          useCanvasInteractionStore.getState().setToolPanel('relation')
        }}
        nodesConnectable={false}
        deleteKeyCode={null}
        viewport={viewport}
        onViewportChange={setViewport}
        maxZoom={1.6}
        minZoom={0.35}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          if (mode === 'relation')
            useCanvasInteractionStore.getState().pickRelationTable(node.id)
          else onSelectTable(node.id)
        }}
        onNodesChange={handleNodesChange}
        onPaneClick={() => {
          if (mode !== 'relation') onSelectTable(null)
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          bgColor="#0f172a"
          color="#334155"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <MiniMap className="hidden lg:block" pannable position="bottom-left" zoomable />
        <Controls position="bottom-right" />
      </ReactFlow>
      <p
        role="status"
        className="pointer-events-none absolute top-3 left-3 rounded bg-slate-900/90 px-3 py-2 text-xs text-slate-300"
      >
        {mode === 'relation'
          ? relationDraft?.sourceTableId
            ? `FK: ${tables.find((table) => table.id === relationDraft.sourceTableId)?.physicalName} · 참조 대상 테이블을 클릭하세요 · Esc: 취소`
            : 'FK 소유 테이블을 클릭하세요 · Esc: 취소'
          : mode === 'draw'
            ? '드래그: 테이블 그리기 · 가운데/오른쪽 드래그: 이동 · Esc: 취소'
            : '빈 공간을 드래그해 화면 이동'}
      </p>
      {drawing &&
        mode === 'draw' &&
        (drawing.end.x !== drawing.start.x || drawing.end.y !== drawing.start.y) && (
          <div
            data-testid="table-drawing-preview"
            className="pointer-events-none absolute rounded border-2 border-dashed border-teal-300 bg-teal-400/10"
            style={{
              left: Math.min(drawing.start.x, drawing.end.x),
              top: Math.min(drawing.start.y, drawing.end.y),
              width: Math.abs(drawing.end.x - drawing.start.x),
              height: Math.abs(drawing.end.y - drawing.start.y),
            }}
          />
        )}
    </section>
  )
}

function ErdTableNode({ data, selected }: NodeProps<ErdTableFlowNode>) {
  const picking = useCanvasInteractionStore((state) => state.mode === 'relation')
  const sourceId = useCanvasInteractionStore(
    (state) => state.relationDraft?.sourceTableId,
  )
  return (
    <div
      tabIndex={picking ? 0 : undefined}
      role={picking ? 'button' : undefined}
      aria-label={picking ? `관계 테이블 ${data.table.physicalName} 선택` : undefined}
      onKeyDown={(event) => {
        if (picking && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          event.stopPropagation()
          useCanvasInteractionStore.getState().pickRelationTable(data.table.id)
        }
      }}
    >
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
      <div className={picking ? 'pointer-events-none' : undefined}>
        <ErdTableCard
          displayOptions={data.displayOptions}
          selected={picking ? sourceId === data.table.id : selected}
          editingDisabled={picking}
          table={data.table}
          keys={data.keys}
          relations={data.relations}
        />
      </div>
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
    </div>
  )
}
