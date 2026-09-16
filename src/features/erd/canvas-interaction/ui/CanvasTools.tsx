import { useEffect } from 'react'
import {
  ArrowRightLeft,
  Braces,
  Columns2,
  Database,
  FileCode2,
  GitBranch,
  Hand,
  MessageSquare,
  RectangleHorizontal,
  Search,
  TriangleAlert,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useErdEditorStore } from '@/entities/erd/model'
import {
  subscribeToRelationEndpoints,
  useCanvasInteractionStore,
} from '../model/use-canvas-interaction-store'

function Tool({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-teal-600 aria-pressed:bg-zinc-950 aria-pressed:text-white"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

export function CanvasTools() {
  useEffect(() => subscribeToRelationEndpoints(), [])
  const {
    mode,
    setMode,
    toolPanel,
    setToolPanel,
    beginRelation,
    cancelRelation,
    cardinality,
  } = useCanvasInteractionStore()
  const { project, patchDisplayOptions } = useErdEditorStore()
  const display = project.displayOptions
  const open = (panel: 'search' | 'ddl' | 'validation') => {
    cancelRelation()
    setToolPanel(toolPanel === panel ? null : panel)
  }
  return (
    <nav
      aria-label="캔버스 도구"
      className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-zinc-200 bg-white py-3"
    >
      <Tool
        label="테이블 그리기"
        icon={RectangleHorizontal}
        active={mode === 'draw'}
        onClick={() => {
          setMode('draw')
          setToolPanel(null)
        }}
      />
      <Tool
        label="화면 이동"
        icon={Hand}
        active={mode === 'pan'}
        onClick={() => {
          setMode('pan')
          setToolPanel(null)
        }}
      />
      <hr className="my-2 w-8 border-zinc-200" />
      <Tool
        label="논리명 표시"
        icon={Type}
        active={display.showLogicalName && !display.showPhysicalName}
        onClick={() =>
          patchDisplayOptions({ showLogicalName: true, showPhysicalName: false })
        }
      />
      <Tool
        label="물리명 표시"
        icon={Database}
        active={!display.showLogicalName && display.showPhysicalName}
        onClick={() =>
          patchDisplayOptions({ showLogicalName: false, showPhysicalName: true })
        }
      />
      <Tool
        label="논리·물리 모두 표시"
        icon={Columns2}
        active={display.showLogicalName && display.showPhysicalName}
        onClick={() =>
          patchDisplayOptions({ showLogicalName: true, showPhysicalName: true })
        }
      />
      <Tool
        label="데이터 타입 표시"
        icon={Braces}
        active={display.showDataType}
        onClick={() => patchDisplayOptions({ showDataType: !display.showDataType })}
      />
      <Tool
        label="코멘트 표시"
        icon={MessageSquare}
        active={display.showComment}
        onClick={() => patchDisplayOptions({ showComment: !display.showComment })}
      />
      <hr className="my-2 w-8 border-zinc-200" />
      <Tool
        label="일대일 관계 연결"
        icon={ArrowRightLeft}
        active={mode === 'relation' && cardinality === 'one-to-one'}
        onClick={() => beginRelation(undefined, 'one-to-one')}
      />
      <Tool
        label="일대다 관계 연결"
        icon={GitBranch}
        active={mode === 'relation' && cardinality === 'one-to-many'}
        onClick={() => beginRelation(undefined, 'one-to-many')}
      />
      {mode === 'relation' && (
        <Tool
          label="연결 취소"
          icon={X}
          active={false}
          onClick={() => {
            cancelRelation()
            setToolPanel(null)
          }}
        />
      )}
      <hr className="my-2 w-8 border-zinc-200" />
      <Tool
        label="테이블 검색 열기"
        icon={Search}
        active={toolPanel === 'search'}
        onClick={() => open('search')}
      />
      <Tool
        label="DDL 패널 열기"
        icon={FileCode2}
        active={toolPanel === 'ddl'}
        onClick={() => open('ddl')}
      />
      <Tool
        label="설계 오류 확인"
        icon={TriangleAlert}
        active={toolPanel === 'validation'}
        onClick={() => open('validation')}
      />
    </nav>
  )
}
