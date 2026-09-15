import { useErdEditorStore } from '@/entities/erd/model'

export function ErdValidation() {
  const store = useErdEditorStore()
  if (!store.validationIssues.length) return null
  return (
    <section
      className="space-y-2 rounded border border-red-300 bg-red-50 p-3"
      aria-label="설계 오류"
      role="alert"
    >
      <h2 className="font-semibold text-red-800">
        설계 오류 {store.validationIssues.length}개
      </h2>
      <ul className="space-y-2 text-sm">
        {store.validationIssues.map((issue, index) => (
          <li key={`${issue.code}-${index}`}>
            <p>{issue.message}</p>
            <button
              className="underline"
              type="button"
              onClick={() => {
                const itemIndex = issue.path[1]
                if (typeof itemIndex !== 'number') return
                if (issue.path[0] === 'relations')
                  store.selectRelation(store.project.relations[itemIndex]?.id ?? null)
                else if (issue.path[0] === 'keys')
                  store.selectTable(store.project.keys[itemIndex]?.tableId ?? null)
                else if (issue.path[0] === 'tables')
                  store.selectTable(store.project.tables[itemIndex]?.id ?? null)
              }}
            >
              관련 항목 편집
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
