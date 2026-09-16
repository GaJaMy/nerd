import { useState } from 'react'
import { useCanvasInteractionStore } from '@/features/erd/canvas-interaction/model/use-canvas-interaction-store'
import {
  createErdRelation,
  relationCardinalitySchema,
  useErdEditorStore,
  validateErdProject,
  type ErdRelation,
} from '@/entities/erd/model'

export function RelationEditor() {
  const store = useErdEditorStore()
  const { mode, relationDraft, beginRelation, cancelRelation, cardinality } =
    useCanvasInteractionStore()
  const selected = store.project.relations.find(
    (relation) => relation.id === store.selectedRelationId,
  )
  const editing = relationDraft
    ? store.project.relations.find((relation) => relation.id === relationDraft.relationId)
    : selected
  const sourceId = relationDraft ? relationDraft.sourceTableId : selected?.sourceTableId
  const targetId = relationDraft ? relationDraft.targetTableId : selected?.targetTableId
  return (
    <section aria-label="관계 설정" className="space-y-3 border-t pt-4">
      <h2 className="font-semibold">관계 설정</h2>
      <button
        type="button"
        className="rounded border px-3 py-2"
        onClick={() => beginRelation(undefined, cardinality)}
      >
        관계 연결
      </button>
      {selected && !relationDraft && (
        <button
          type="button"
          className="ml-2 rounded border px-3 py-2"
          onClick={() => beginRelation(selected.id)}
        >
          두 테이블 다시 선택
        </button>
      )}
      {mode === 'relation' && (
        <p role="status" className="text-sm text-teal-700">
          {relationDraft?.sourceTableId
            ? `FK: ${store.project.tables.find((table) => table.id === relationDraft.sourceTableId)?.physicalName} → 캔버스에서 참조 대상 테이블을 클릭하세요.`
            : '캔버스에서 FK 소유 테이블을 클릭하세요.'}
        </p>
      )}
      {relationDraft && (
        <button
          type="button"
          className="rounded border px-3 py-2"
          onClick={cancelRelation}
        >
          연결 취소
        </button>
      )}
      {mode !== 'relation' && sourceId && targetId && (
        <RelationForm
          key={`${editing?.id ?? 'new'}:${sourceId}:${targetId}:${cardinality}`}
          relation={editing}
          sourceId={sourceId}
          targetId={targetId}
        />
      )}
      <ul className="space-y-2">
        {store.project.relations.map((relation) => (
          <li key={relation.id}>
            <button
              type="button"
              className="w-full rounded border p-2 text-left"
              aria-pressed={selected?.id === relation.id}
              onClick={() => {
                cancelRelation()
                store.selectRelation(relation.id)
              }}
            >
              {relation.label ?? '관계'}:{' '}
              {
                store.project.tables.find((table) => table.id === relation.sourceTableId)
                  ?.physicalName
              }{' '}
              →{' '}
              {
                store.project.tables.find((table) => table.id === relation.targetTableId)
                  ?.physicalName
              }{' '}
              ({relation.cardinality === 'one-to-one' ? '1:1' : 'N:1'})
            </button>
          </li>
        ))}
      </ul>
      {!store.project.relations.length && (
        <p className="text-sm text-zinc-500">설정된 관계가 없습니다.</p>
      )}
    </section>
  )
}

function RelationForm({
  relation,
  sourceId,
  targetId,
}: {
  relation: ErdRelation | undefined
  sourceId: string
  targetId: string
}) {
  const store = useErdEditorStore()
  const cardinality = useCanvasInteractionStore((state) => state.cardinality)
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (relation?.sourceTableId === sourceId && relation.targetTableId === targetId
        ? relation.columnMappings
        : []
      ).map((item) => [item.targetColumnId, item.sourceColumnId]),
    ),
  )
  const [error, setError] = useState('')
  const source = store.project.tables.find((table) => table.id === sourceId)
  const target = store.project.tables.find((table) => table.id === targetId)
  const targetKey = store.project.keys.find(
    (key) => key.tableId === targetId && key.type === 'primary',
  )
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (
          !source ||
          !target ||
          !targetKey ||
          targetKey.columnIds.some((id) => !mapping[id])
        ) {
          setError('양쪽 테이블, 참조 대상 PK와 모든 FK 컬럼을 선택하세요.')
          return
        }
        const data = new FormData(event.currentTarget)
        const label = data.get('label')
        const candidate = createErdRelation({
          ...(relation ? { id: relation.id } : {}),
          sourceTableId: source.id,
          targetTableId: target.id,
          cardinality: relationCardinalitySchema.parse(data.get('cardinality')),
          columnMappings: targetKey.columnIds.map((id, ordinal) => ({
            targetColumnId: id,
            sourceColumnId: mapping[id]!,
            ordinal,
          })),
          ...(typeof label === 'string' && label.trim() ? { label: label.trim() } : {}),
        })
        const relations = store.project.relations.filter(
          (item) => item.id !== relation?.id,
        )
        const issues = validateErdProject({
          ...store.project,
          relations: [...relations, candidate],
        }).filter(
          (issue) => issue.path[0] === 'relations' && issue.path[1] === relations.length,
        )
        if (issues.length) {
          setError(issues.map((issue) => issue.message).join(' '))
          return
        }
        if (relation)
          store.updateRelation(relation.id, { ...candidate, label: candidate.label })
        else
          store.addRelation({
            id: candidate.id,
            sourceTableId: candidate.sourceTableId,
            targetTableId: candidate.targetTableId,
            cardinality: candidate.cardinality,
            columnMappings: candidate.columnMappings,
            ...(candidate.label ? { label: candidate.label } : {}),
          })
        useCanvasInteractionStore.getState().cancelRelation()
        setError('')
      }}
    >
      <dl className="rounded bg-zinc-50 p-3 text-sm">
        <dt className="text-zinc-500">FK 소유 테이블</dt>
        <dd>{source?.physicalName}</dd>
        <dt className="mt-2 text-zinc-500">참조 대상 테이블</dt>
        <dd>{target?.physicalName}</dd>
      </dl>
      {!targetKey && (
        <p className="text-xs text-zinc-600">참조 대상 테이블에 PK를 먼저 설정하세요.</p>
      )}
      {targetKey?.columnIds.map((id, index) => (
        <label className="block" key={id}>
          FK {index + 1} →{' '}
          {target?.columns.find((column) => column.id === id)?.physicalName}
          <select
            className="block w-full rounded border p-2"
            value={mapping[id] ?? ''}
            onChange={(event) => setMapping({ ...mapping, [id]: event.target.value })}
          >
            <option value="">FK 컬럼 선택</option>
            {source?.columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.physicalName}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="block">
        관계 종류
        <select
          className="block w-full rounded border p-2"
          name="cardinality"
          defaultValue={relation?.cardinality ?? cardinality}
        >
          <option value="one-to-many">일대다 (참조 대상 1 : FK 소유 N)</option>
          <option value="one-to-one">일대일</option>
        </select>
      </label>
      <label className="block">
        관계 이름
        <input
          className="block w-full rounded border p-2"
          name="label"
          defaultValue={relation?.label}
        />
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <button className="rounded border px-3 py-2" type="submit">
        {relation ? '관계 적용' : '관계 추가'}
      </button>
      {relation && (
        <>
          <button
            className="ml-2 rounded border px-3 py-2"
            type="button"
            onClick={() => useCanvasInteractionStore.getState().beginRelation()}
          >
            새 관계
          </button>
          <button
            className="rounded border px-3 py-2 text-red-700"
            type="button"
            onClick={() => {
              if (window.confirm('관계를 삭제할까요? 컬럼과 PK는 유지됩니다.'))
                store.deleteRelation(relation.id)
            }}
          >
            관계 삭제
          </button>
        </>
      )}
    </form>
  )
}
