import { useState } from 'react'
import { erdTableSchema, useErdEditorStore, type ErdTable } from '@/entities/erd/model'

export function TableEditor({ table }: { table: ErdTable }) {
  const updateTable = useErdEditorStore((state) => state.updateTable)
  const deleteTable = useErdEditorStore((state) => state.deleteTable)
  const [error, setError] = useState('')
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const logicalName = data.get('logicalName')
        const result = erdTableSchema.safeParse({
          ...table,
          physicalName: data.get('physicalName'),
          logicalName:
            typeof logicalName === 'string' ? logicalName.trim() || undefined : undefined,
          comment: data.get('comment'),
        })
        if (!result.success) {
          setError(
            '물리명은 영문 또는 밑줄로 시작하는 영문·숫자·밑줄 64자 이내로 입력하세요.',
          )
          return
        }
        if (
          useErdEditorStore
            .getState()
            .project.tables.some(
              (other) =>
                other.id !== table.id &&
                other.physicalName.toLowerCase() ===
                  result.data.physicalName.toLowerCase(),
            )
        ) {
          setError('테이블 물리명이 중복되었습니다.')
          return
        }
        updateTable(table.id, result.data)
        setError('')
      }}
    >
      <h2 className="font-semibold">선택된 테이블</h2>
      <label className="block">
        테이블 물리명
        <input
          className="block w-full rounded border p-2"
          name="physicalName"
          defaultValue={table.physicalName}
          required
        />
      </label>
      <label className="block">
        테이블 논리명
        <input
          className="block w-full rounded border p-2"
          name="logicalName"
          defaultValue={table.logicalName}
        />
      </label>
      <label className="block">
        테이블 코멘트
        <textarea
          className="block w-full rounded border p-2"
          name="comment"
          defaultValue={table.comment}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="rounded bg-zinc-900 px-3 py-2 text-white" type="submit">
        테이블 적용
      </button>
      <button
        className="ml-2 rounded border px-3 py-2 text-red-700"
        type="button"
        onClick={() => {
          if (window.confirm('테이블과 연결된 키·관계를 삭제할까요?'))
            deleteTable(table.id)
        }}
      >
        테이블 삭제
      </button>
    </form>
  )
}
