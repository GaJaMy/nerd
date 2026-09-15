import { erdTableSchema, type ErdProject } from './schema'

export function validateNameEdit(
  project: ErdProject,
  tableId: string,
  columnId: string | undefined,
  field: 'logicalName' | 'physicalName',
  value: string,
): string {
  if (field === 'logicalName') return ''
  if (!erdTableSchema.shape.physicalName.safeParse(value).success)
    return '물리명은 영문 또는 밑줄로 시작하는 영문·숫자·밑줄 64자 이내로 입력하세요.'
  const siblings = columnId
    ? (project.tables.find((table) => table.id === tableId)?.columns ?? [])
    : project.tables
  if (
    siblings.some(
      (item) =>
        item.id !== (columnId ?? tableId) &&
        item.physicalName.toLowerCase() === value.trim().toLowerCase(),
    )
  )
    return '물리명이 중복되었습니다.'
  return ''
}
