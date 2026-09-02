import { erdProjectSchema, type ErdProject, type ErdTable } from './schema'

export type ErdValidationIssue = {
  code: 'duplicate-column-physical-name' | 'duplicate-table-physical-name' | 'schema'
  message: string
  path: Array<number | string>
}

export function validateErdProject(project: ErdProject): ErdValidationIssue[] {
  const schemaResult = erdProjectSchema.safeParse(project)

  if (!schemaResult.success) {
    return schemaResult.error.issues.map((issue) => ({
      code: 'schema',
      message: issue.message,
      path: issue.path.map((pathItem) =>
        typeof pathItem === 'symbol' ? pathItem.toString() : pathItem,
      ),
    }))
  }

  const validProject = schemaResult.data

  return [
    ...findDuplicateTablePhysicalNameIssues(validProject.tables),
    ...validProject.tables.flatMap((table, tableIndex) =>
      findDuplicateColumnPhysicalNameIssues(table, tableIndex),
    ),
  ]
}

function findDuplicateTablePhysicalNameIssues(tables: ErdTable[]): ErdValidationIssue[] {
  const firstIndexes = new Map<string, number>()
  const issues: ErdValidationIssue[] = []

  tables.forEach((table, tableIndex) => {
    const key = table.physicalName.trim().toLowerCase()
    const firstIndex = firstIndexes.get(key)

    if (firstIndex === undefined) {
      firstIndexes.set(key, tableIndex)
      return
    }

    issues.push({
      code: 'duplicate-table-physical-name',
      message: `테이블 물리명 "${table.physicalName}"이 중복되었습니다.`,
      path: ['tables', tableIndex, 'physicalName'],
    })
  })

  return issues
}

function findDuplicateColumnPhysicalNameIssues(
  table: ErdTable,
  tableIndex: number,
): ErdValidationIssue[] {
  const firstIndexes = new Map<string, number>()
  const issues: ErdValidationIssue[] = []

  table.columns.forEach((column, columnIndex) => {
    const key = column.physicalName.trim().toLowerCase()
    const firstIndex = firstIndexes.get(key)

    if (firstIndex === undefined) {
      firstIndexes.set(key, columnIndex)
      return
    }

    issues.push({
      code: 'duplicate-column-physical-name',
      message: `컬럼 물리명 "${column.physicalName}"이 중복되었습니다.`,
      path: ['tables', tableIndex, 'columns', columnIndex, 'physicalName'],
    })
  })

  return issues
}
