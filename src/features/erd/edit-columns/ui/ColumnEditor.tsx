import { useState } from 'react'
import {
  erdColumnSchema,
  MYSQL_DATA_TYPES,
  useErdEditorStore,
  type ErdColumn,
  type ErdTable,
} from '@/entities/erd/model'

export function ColumnEditor({ table }: { table: ErdTable }) {
  const store = useErdEditorStore()
  return (
    <section className="space-y-3" aria-label="컬럼 편집">
      <h2 className="font-semibold">컬럼 편집</h2>
      <button
        type="button"
        className="rounded border px-3 py-2"
        onClick={() => {
          let index = 1
          while (
            table.columns.some(
              (column) => column.physicalName.toLowerCase() === `column_${index}`,
            )
          )
            index++
          store.addColumn(table.id, {
            physicalName: `column_${index}`,
            dataType: { name: 'BIGINT' },
            nullable: true,
          })
        }}
      >
        컬럼 추가
      </button>
      {table.columns.map((column) => (
        <ColumnForm key={column.id} column={column} table={table} />
      ))}
    </section>
  )
}

function ColumnForm({ column, table }: { column: ErdColumn; table: ErdTable }) {
  const store = useErdEditorStore()
  const [type, setType] = useState(column.dataType.name)
  const [error, setError] = useState('')
  const primary = store.project.keys.some(
    (key) =>
      key.type === 'primary' &&
      key.tableId === table.id &&
      key.columnIds.includes(column.id),
  )
  return (
    <form
      aria-label={`컬럼 ${column.physicalName} 편집`}
      className="space-y-2 rounded border p-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const logical = data.get('logicalName')
        const parsed = erdColumnSchema.safeParse({
          ...column,
          physicalName: data.get('physicalName'),
          logicalName:
            typeof logical === 'string' ? logical.trim() || undefined : undefined,
          comment: data.get('comment'),
          nullable: !primary && data.has('nullable'),
          dataType: {
            name: type,
            ...(type === 'VARCHAR' ? { length: Number(data.get('length')) } : {}),
            ...(type === 'DECIMAL'
              ? {
                  precision: Number(data.get('precision')),
                  scale: Number(data.get('scale')),
                }
              : {}),
            ...(['INT', 'BIGINT'].includes(type)
              ? { unsigned: data.has('unsigned') }
              : {}),
          },
        })
        if (!parsed.success) {
          setError('물리명 또는 타입의 길이·정밀도를 확인하세요.')
          return
        }
        if (
          table.columns.some(
            (other) =>
              other.id !== column.id &&
              other.physicalName.toLowerCase() === parsed.data.physicalName.toLowerCase(),
          )
        ) {
          setError('컬럼 물리명이 중복되었습니다.')
          return
        }
        store.updateColumn(table.id, column.id, parsed.data)
        setError('')
      }}
    >
      <label className="block">
        컬럼 물리명
        <input
          className="block w-full rounded border p-1"
          name="physicalName"
          defaultValue={column.physicalName}
          required
        />
      </label>
      <label className="block">
        컬럼 논리명
        <input
          className="block w-full rounded border p-1"
          name="logicalName"
          defaultValue={column.logicalName}
        />
      </label>
      <label className="block">
        데이터 타입
        <select
          className="block w-full rounded border p-1"
          value={type}
          onChange={(event) => {
            const parsed = erdColumnSchema.shape.dataType.shape.name.safeParse(
              event.target.value,
            )
            if (parsed.success) setType(parsed.data)
          }}
        >
          {MYSQL_DATA_TYPES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      {type === 'VARCHAR' && (
        <label className="block">
          길이
          <input
            className="block w-full rounded border p-1"
            name="length"
            type="number"
            min="1"
            max="16383"
            defaultValue={column.dataType.length ?? 255}
            required
          />
        </label>
      )}
      {type === 'DECIMAL' && (
        <>
          <label className="block">
            정밀도
            <input
              className="block w-full rounded border p-1"
              name="precision"
              type="number"
              min="1"
              max="65"
              defaultValue={column.dataType.precision ?? 10}
              required
            />
          </label>
          <label className="block">
            소수 자릿수
            <input
              className="block w-full rounded border p-1"
              name="scale"
              type="number"
              min="0"
              max="30"
              defaultValue={column.dataType.scale ?? 2}
              required
            />
          </label>
        </>
      )}
      {['INT', 'BIGINT'].includes(type) && (
        <label className="block">
          <input
            name="unsigned"
            type="checkbox"
            defaultChecked={column.dataType.unsigned}
          />{' '}
          UNSIGNED
        </label>
      )}
      <label className="block">
        <input
          key={`${primary}-${column.nullable}`}
          name="nullable"
          type="checkbox"
          disabled={primary}
          defaultChecked={!primary && column.nullable}
        />{' '}
        NULL 허용{primary ? ' (PK는 NOT NULL)' : ''}
      </label>
      <label className="block">
        컬럼 코멘트
        <textarea
          className="block w-full rounded border p-1"
          name="comment"
          defaultValue={column.comment}
        />
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <button className="rounded border px-2 py-1" type="submit">
        컬럼 적용
      </button>
      <button
        className="ml-2 rounded border px-2 py-1 text-red-700"
        type="button"
        onClick={() => {
          if (window.confirm('컬럼과 연결된 관계를 삭제하고 키 구성을 갱신할까요?'))
            store.deleteColumn(table.id, column.id)
        }}
      >
        컬럼 삭제
      </button>
    </form>
  )
}
