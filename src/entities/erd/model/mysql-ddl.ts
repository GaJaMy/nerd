import {
  erdProjectSchema,
  type ErdProject,
  type ErdTable,
  type MysqlDataType,
} from './schema'
import { validateErdProject } from './validation'

export function formatMysqlType(type: MysqlDataType): string {
  const options =
    type.name === 'VARCHAR'
      ? `(${type.length})`
      : type.name === 'DECIMAL'
        ? `(${type.precision}, ${type.scale})`
        : ''
  return `${type.name}${options}${type.unsigned ? ' UNSIGNED' : ''}`
}

export function getMysqlExportIssues(project: ErdProject): string[] {
  const issues = validateErdProject(project).map((issue) => issue.message)
  if (issues.length) return issues
  if (!project.tables.length) issues.push('내보낼 테이블이 없습니다.')
  for (const table of project.tables) {
    const rowBytes = table.columns.reduce(
      (total, column) =>
        total +
        (column.dataType.name === 'VARCHAR'
          ? column.dataType.length! * 4 + 2
          : column.dataType.name === 'TEXT'
            ? 12
            : 34),
      Math.ceil(table.columns.length / 8),
    )
    if (table.columns.length > 1017 || rowBytes > 65535)
      issues.push(
        `${table.physicalName}: 컬럼 수 또는 최대 행 크기 한도를 초과했습니다. 긴 문자열은 TEXT로 변경하세요.`,
      )
    if (!table.columns.length)
      issues.push(`${table.physicalName}: 컬럼을 하나 이상 추가하세요.`)
    if ((table.comment?.length ?? 0) > 2048)
      issues.push(`${table.physicalName}: 테이블 코멘트는 2048자 이내여야 합니다.`)
    for (const column of table.columns) {
      if (hasControlCharacter(column.comment ?? ''))
        issues.push(
          `${table.physicalName}.${column.physicalName}: 코멘트의 제어 문자를 제거하세요.`,
        )
      if (column.defaultValue !== undefined)
        issues.push(
          `${table.physicalName}.${column.physicalName}: 기본값 export는 이번 MVP에서 지원하지 않습니다.`,
        )
      if ((column.comment?.length ?? 0) > 1024)
        issues.push(
          `${table.physicalName}.${column.physicalName}: 컬럼 코멘트는 1024자 이내여야 합니다.`,
        )
    }
    if (hasControlCharacter(table.comment ?? ''))
      issues.push(`${table.physicalName}: 코멘트의 제어 문자를 제거하세요.`)
    const keys = project.keys.filter((key) => key.tableId === table.id)
    const names = new Set<string>()
    for (const key of keys) {
      if (key.type === 'foreign') {
        if (
          !project.relations.some(
            (relation) =>
              relation.sourceTableId === table.id &&
              sameColumns(
                [...relation.columnMappings]
                  .sort((a, b) => a.ordinal - b.ordinal)
                  .map((mapping) => mapping.sourceColumnId),
                key.columnIds,
              ),
          )
        )
          issues.push(`${table.physicalName}: FK 키에 대응하는 관계를 설정하세요.`)
        continue
      }
      if (key.name) {
        const name = key.name.toLowerCase()
        if (names.has(name) || (name === 'primary' && key.type !== 'primary'))
          issues.push(`${table.physicalName}: 키 이름이 중복되거나 예약된 이름입니다.`)
        names.add(name)
      }
      checkIndex(table, key.columnIds, issues)
    }
    for (const relation of project.relations.filter(
      (relation) => relation.sourceTableId === table.id,
    ))
      checkIndex(
        table,
        relation.columnMappings.map((mapping) => mapping.sourceColumnId),
        issues,
      )
  }
  return [...new Set(issues)]
}

// Conservative upper bounds for the default 16KB InnoDB page and utf8mb4.
function checkIndex(table: ErdTable, ids: string[], issues: string[]) {
  const bytes = ids.reduce((total, id) => {
    const type = table.columns.find((column) => column.id === id)!.dataType
    return (
      total +
      (type.name === 'VARCHAR'
        ? type.length! * 4
        : type.name === 'DECIMAL'
          ? Math.ceil(type.precision! / 9) * 4 + 4
          : 8)
    )
  }, 0)
  if (ids.length > 16 || bytes > 3072)
    issues.push(
      `${table.physicalName}: 키는 16개 컬럼 및 utf8mb4 기준 3072바이트 이내로 구성하세요.`,
    )
}

export function exportMysqlDdl(input: ErdProject): string {
  const project = erdProjectSchema.parse(input)
  const issues = getMysqlExportIssues(project)
  if (issues.length) throw new Error(issues.join('\n'))
  const statements = [
    '-- MySQL 8.4 / InnoDB (16KB page) / utf8mb4',
    'SET @nerd_previous_sql_mode = @@SESSION.sql_mode;',
    "SET SESSION sql_mode = CONCAT_WS(',', @@SESSION.sql_mode, 'NO_BACKSLASH_ESCAPES');",
  ]
  for (const table of project.tables) {
    const keys = project.keys.filter((key) => key.tableId === table.id)
    const lines = [...table.columns]
      .sort((a, b) => a.ordinal - b.ordinal)
      .map(
        (column) =>
          `  ${identifier(column.physicalName)} ${formatMysqlType(column.dataType)} ${column.nullable ? 'NULL' : 'NOT NULL'}${column.comment ? ` COMMENT ${literal(column.comment)}` : ''}`,
      )
    for (const key of keys.filter((key) => key.type !== 'foreign')) {
      lines.push(
        `  ${key.type === 'primary' ? 'PRIMARY KEY' : `UNIQUE KEY${key.name ? ` ${identifier(key.name)}` : ''}`} (${columnNames(table, key.columnIds)})`,
      )
    }
    const uniqueSets = keys
      .filter((key) => key.type !== 'foreign')
      .map((key) => key.columnIds)
    for (const relation of project.relations.filter(
      (relation) =>
        relation.sourceTableId === table.id && relation.cardinality === 'one-to-one',
    )) {
      const ids = [...relation.columnMappings]
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((mapping) => mapping.sourceColumnId)
      if (
        !uniqueSets.some(
          (columns) =>
            columns.length === ids.length && columns.every((id) => ids.includes(id)),
        )
      ) {
        lines.push(`  UNIQUE KEY (${columnNames(table, ids)})`)
        uniqueSets.push(ids)
      }
    }
    statements.push(
      `CREATE TABLE ${identifier(table.physicalName)} (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin${table.comment ? ` COMMENT=${literal(table.comment)}` : ''};`,
    )
  }
  for (const [index, relation] of project.relations.entries()) {
    const source = project.tables.find((table) => table.id === relation.sourceTableId)!
    const target = project.tables.find((table) => table.id === relation.targetTableId)!
    const mapping = [...relation.columnMappings].sort((a, b) => a.ordinal - b.ordinal)
    statements.push(
      `ALTER TABLE ${identifier(source.physicalName)} ADD CONSTRAINT ${identifier(`fk_nerd_${index + 1}`)} FOREIGN KEY (${columnNames(
        source,
        mapping.map((item) => item.sourceColumnId),
      )}) REFERENCES ${identifier(target.physicalName)} (${columnNames(
        target,
        mapping.map((item) => item.targetColumnId),
      )});`,
    )
  }
  statements.push('SET SESSION sql_mode = @nerd_previous_sql_mode;')
  return `${statements.join('\n\n')}\n`
}

function sameColumns(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}
function columnNames(table: ErdTable, ids: string[]) {
  return ids
    .map((id) =>
      identifier(table.columns.find((column) => column.id === id)!.physicalName),
    )
    .join(', ')
}
function identifier(name: string) {
  return `\`${name.replaceAll('`', '``')}\``
}
function literal(value: string) {
  return `'${value.replaceAll("'", "''")}'`
}

function hasControlCharacter(value: string) {
  return [...value].some(
    (character) => character.charCodeAt(0) === 0 || character.charCodeAt(0) === 26,
  )
}
