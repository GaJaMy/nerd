import { useState } from 'react'
import { useErdEditorStore } from '@/entities/erd/model'
import { exportMysqlDdl, getMysqlExportIssues } from '@/entities/erd/model/mysql-ddl'

export function DdlExport() {
  const project = useErdEditorStore((state) => state.project)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const issues = open ? getMysqlExportIssues(project) : []
  const ddl = open && !issues.length ? exportMysqlDdl(project) : ''
  return (
    <section className="space-y-3 border-t pt-4" aria-label="MySQL DDL 내보내기">
      <button
        className="rounded bg-teal-700 px-3 py-2 font-semibold text-white"
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open)
          setStatus('')
        }}
      >
        MySQL DDL {open ? '닫기' : '내보내기'}
      </button>
      {open && (
        <>
          {issues.length > 0 ? (
            <div role="alert">
              <p className="font-semibold">내보내기 전에 확인하세요</p>
              <ul className="list-disc pl-5">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <label className="block" htmlFor="mysql-ddl-output">
                MySQL DDL
              </label>
              <textarea
                id="mysql-ddl-output"
                className="mt-1 h-64 w-full rounded border p-2 font-mono text-xs"
                value={ddl}
                readOnly
              />
              <button
                className="rounded border px-3 py-2"
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(ddl).then(
                    () => setStatus('복사했습니다.'),
                    () =>
                      setStatus(
                        '복사할 수 없습니다. 텍스트를 선택해 복사하거나 다운로드하세요.',
                      ),
                  )
                  if (!navigator.clipboard)
                    setStatus(
                      '복사할 수 없습니다. 텍스트를 선택해 복사하거나 다운로드하세요.',
                    )
                }}
              >
                DDL 복사
              </button>
              <button
                className="ml-2 rounded border px-3 py-2"
                type="button"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([ddl], { type: 'text/sql;charset=utf-8' }),
                  )
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'erd.sql'
                  link.click()
                  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}
              >
                SQL 다운로드
              </button>
              {status && <p role="status">{status}</p>}
            </>
          )}
        </>
      )}
    </section>
  )
}
