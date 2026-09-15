import {
  erdProjectSchema,
  type ErdKey,
  type ErdProject,
  type ErdRelation,
  type ErdTable,
} from './schema'

export type ErdValidationIssue = {
  code:
    | 'duplicate-column-physical-name'
    | 'duplicate-key-column'
    | 'duplicate-primary-key'
    | 'duplicate-relation-mapping-ordinal'
    | 'duplicate-table-physical-name'
    | 'missing-key-column'
    | 'missing-key-table'
    | 'missing-relation-source-column'
    | 'missing-relation-source-table'
    | 'missing-relation-target-column'
    | 'missing-relation-target-table'
    | 'relation-target-key-mismatch'
    | 'schema'
    | 'invalid-key-column'
    | 'duplicate-relation-source-column'
    | 'incompatible-relation-column'
  message: string
  path: Array<number | string>
}

type TableIndex = Map<string, { table: ErdTable }>
type ColumnIndexByTableId = Map<string, Map<string, number>>

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
  const tableIndex = createTableIndex(validProject.tables)
  const columnIndexByTableId = createColumnIndexByTableId(validProject.tables)

  return [
    ...findDuplicateTablePhysicalNameIssues(validProject.tables),
    ...validProject.tables.flatMap((table, tableIndex) =>
      findDuplicateColumnPhysicalNameIssues(table, tableIndex),
    ),
    ...findKeyReferenceIssues(validProject.keys, tableIndex, columnIndexByTableId),
    ...findDuplicatePrimaryKeyIssues(validProject.keys),
    ...findMysqlConstraintIssues(validProject),
    ...findRelationReferenceIssues(
      validProject.relations,
      validProject.keys,
      tableIndex,
      columnIndexByTableId,
    ),
  ]
}

function findMysqlConstraintIssues(project: ErdProject): ErdValidationIssue[] {
  const issues: ErdValidationIssue[] = []
  for (const [index, key] of project.keys.entries()) {
    const table = project.tables.find((table) => table.id === key.tableId)
    for (const id of key.columnIds) {
      const column = table?.columns.find((column) => column.id === id)
      if (
        column &&
        (column.dataType.name === 'TEXT' || (key.type === 'primary' && column.nullable))
      ) {
        issues.push({
          code: 'invalid-key-column',
          message: `${table?.physicalName}.${column.physicalName}: TEXT는 키로 사용할 수 없으며 PK는 NOT NULL이어야 합니다.`,
          path: ['keys', index],
        })
      }
    }
  }
  for (const [index, relation] of project.relations.entries()) {
    const source = project.tables.find((table) => table.id === relation.sourceTableId)
    const target = project.tables.find((table) => table.id === relation.targetTableId)
    const seen = new Set<string>()
    for (const mapping of relation.columnMappings) {
      if (seen.has(mapping.sourceColumnId))
        issues.push({
          code: 'duplicate-relation-source-column',
          message: '하나의 관계에서 FK 컬럼을 중복 매핑할 수 없습니다.',
          path: ['relations', index],
        })
      seen.add(mapping.sourceColumnId)
      const left = source?.columns.find(
        (column) => column.id === mapping.sourceColumnId,
      )?.dataType
      const right = target?.columns.find(
        (column) => column.id === mapping.targetColumnId,
      )?.dataType
      if (
        left &&
        right &&
        (left.name === 'TEXT' ||
          left.name !== right.name ||
          !!left.unsigned !== !!right.unsigned ||
          left.precision !== right.precision ||
          left.scale !== right.scale)
      ) {
        issues.push({
          code: 'incompatible-relation-column',
          message: `${source?.physicalName} → ${target?.physicalName}: FK와 참조 컬럼의 타입·정밀도·UNSIGNED가 일치해야 합니다.`,
          path: ['relations', index],
        })
      }
    }
  }
  return issues
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

function findKeyReferenceIssues(
  keys: ErdKey[],
  tableIndex: TableIndex,
  columnIndexByTableId: ColumnIndexByTableId,
): ErdValidationIssue[] {
  const issues: ErdValidationIssue[] = []

  keys.forEach((key, keyIndex) => {
    const tableRecord = tableIndex.get(key.tableId)

    if (tableRecord === undefined) {
      issues.push({
        code: 'missing-key-table',
        message: `키가 참조하는 테이블 "${key.tableId}"이 존재하지 않습니다.`,
        path: ['keys', keyIndex, 'tableId'],
      })
      return
    }

    const columnIndex = columnIndexByTableId.get(key.tableId)
    const seenColumnIds = new Set<string>()

    key.columnIds.forEach((columnId, columnIdIndex) => {
      if (seenColumnIds.has(columnId)) {
        issues.push({
          code: 'duplicate-key-column',
          message: `키 "${key.id}"에 컬럼 "${columnId}"이 중복 포함되었습니다.`,
          path: ['keys', keyIndex, 'columnIds', columnIdIndex],
        })
        return
      }

      seenColumnIds.add(columnId)

      if (!columnIndex?.has(columnId)) {
        issues.push({
          code: 'missing-key-column',
          message: `키가 참조하는 컬럼 "${columnId}"이 테이블 "${tableRecord.table.physicalName}"에 존재하지 않습니다.`,
          path: ['keys', keyIndex, 'columnIds', columnIdIndex],
        })
      }
    })
  })

  return issues
}

function findDuplicatePrimaryKeyIssues(keys: ErdKey[]): ErdValidationIssue[] {
  const firstPrimaryKeyIndexes = new Map<string, number>()
  const issues: ErdValidationIssue[] = []

  keys.forEach((key, keyIndex) => {
    if (key.type !== 'primary') {
      return
    }

    const firstPrimaryKeyIndex = firstPrimaryKeyIndexes.get(key.tableId)

    if (firstPrimaryKeyIndex === undefined) {
      firstPrimaryKeyIndexes.set(key.tableId, keyIndex)
      return
    }

    issues.push({
      code: 'duplicate-primary-key',
      message: `테이블 "${key.tableId}"에 primary key가 2개 이상 있습니다.`,
      path: ['keys', keyIndex, 'type'],
    })
  })

  return issues
}

function findRelationReferenceIssues(
  relations: ErdRelation[],
  keys: ErdKey[],
  tableIndex: TableIndex,
  columnIndexByTableId: ColumnIndexByTableId,
): ErdValidationIssue[] {
  const issues: ErdValidationIssue[] = []

  relations.forEach((relation, relationIndex) => {
    const sourceTableRecord = tableIndex.get(relation.sourceTableId)
    const targetTableRecord = tableIndex.get(relation.targetTableId)

    if (sourceTableRecord === undefined) {
      issues.push({
        code: 'missing-relation-source-table',
        message: `관계가 참조하는 source table "${relation.sourceTableId}"이 존재하지 않습니다.`,
        path: ['relations', relationIndex, 'sourceTableId'],
      })
    }

    if (targetTableRecord === undefined) {
      issues.push({
        code: 'missing-relation-target-table',
        message: `관계가 참조하는 target table "${relation.targetTableId}"이 존재하지 않습니다.`,
        path: ['relations', relationIndex, 'targetTableId'],
      })
    }

    const sourceColumnIndex = columnIndexByTableId.get(relation.sourceTableId)
    const targetColumnIndex = columnIndexByTableId.get(relation.targetTableId)
    const seenOrdinals = new Set<number>()

    relation.columnMappings.forEach((mapping, mappingIndex) => {
      if (seenOrdinals.has(mapping.ordinal)) {
        issues.push({
          code: 'duplicate-relation-mapping-ordinal',
          message: `관계 "${relation.id}"에 column mapping 순서 "${mapping.ordinal}"이 중복되었습니다.`,
          path: ['relations', relationIndex, 'columnMappings', mappingIndex, 'ordinal'],
        })
      }

      seenOrdinals.add(mapping.ordinal)

      if (
        sourceTableRecord !== undefined &&
        !sourceColumnIndex?.has(mapping.sourceColumnId)
      ) {
        issues.push({
          code: 'missing-relation-source-column',
          message: `관계가 참조하는 source column "${mapping.sourceColumnId}"이 테이블 "${sourceTableRecord.table.physicalName}"에 존재하지 않습니다.`,
          path: [
            'relations',
            relationIndex,
            'columnMappings',
            mappingIndex,
            'sourceColumnId',
          ],
        })
      }

      if (
        targetTableRecord !== undefined &&
        !targetColumnIndex?.has(mapping.targetColumnId)
      ) {
        issues.push({
          code: 'missing-relation-target-column',
          message: `관계가 참조하는 target column "${mapping.targetColumnId}"이 테이블 "${targetTableRecord.table.physicalName}"에 존재하지 않습니다.`,
          path: [
            'relations',
            relationIndex,
            'columnMappings',
            mappingIndex,
            'targetColumnId',
          ],
        })
      }
    })

    if (
      targetTableRecord !== undefined &&
      relation.columnMappings.every((mapping) =>
        targetColumnIndex?.has(mapping.targetColumnId),
      ) &&
      !hasMatchingTargetKey(relation, keys)
    ) {
      issues.push({
        code: 'relation-target-key-mismatch',
        message: `관계 "${relation.id}"의 target column mapping과 일치하는 primary/unique key가 없습니다.`,
        path: ['relations', relationIndex, 'columnMappings'],
      })
    }
  })

  return issues
}

function hasMatchingTargetKey(relation: ErdRelation, keys: ErdKey[]) {
  const targetColumnIds = getOrderedTargetColumnIds(relation)

  return keys.some(
    (key) =>
      key.tableId === relation.targetTableId &&
      key.type !== 'foreign' &&
      areStringArraysEqual(key.columnIds, targetColumnIds),
  )
}

function getOrderedTargetColumnIds(relation: ErdRelation) {
  return [...relation.columnMappings]
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((mapping) => mapping.targetColumnId)
}

function areStringArraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((item, index) => item === right[index])
  )
}

function createTableIndex(tables: ErdTable[]): TableIndex {
  return new Map(tables.map((table) => [table.id, { table }] as const))
}

function createColumnIndexByTableId(tables: ErdTable[]): ColumnIndexByTableId {
  return new Map(
    tables.map((table) => [
      table.id,
      new Map(
        table.columns.map((column, columnIndex) => [column.id, columnIndex] as const),
      ),
    ]),
  )
}
