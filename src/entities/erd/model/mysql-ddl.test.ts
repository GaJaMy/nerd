import {
  createErdColumn,
  createErdKey,
  createErdProject,
  createErdRelation,
  createErdTable,
} from './factory'
import { exportMysqlDdl, getMysqlExportIssues } from './mysql-ddl'

function fixture() {
  const parent = createErdTable({
    id: 'parent',
    physicalName: 'parents',
    hidden: true,
    comment: "고객's \\경로",
    columns: [
      createErdColumn({
        id: 'p1',
        physicalName: 'tenant_id',
        dataType: { name: 'INT' },
        nullable: false,
        ordinal: 0,
      }),
      createErdColumn({
        id: 'p2',
        physicalName: 'id',
        dataType: { name: 'BIGINT', unsigned: true },
        nullable: false,
        ordinal: 1,
      }),
    ],
  })
  const child = createErdTable({
    id: 'child',
    physicalName: 'children',
    columns: [
      createErdColumn({
        id: 'c2',
        physicalName: 'parent_id',
        dataType: { name: 'BIGINT', unsigned: true },
        nullable: true,
        ordinal: 1,
      }),
      createErdColumn({
        id: 'c1',
        physicalName: 'tenant_id',
        dataType: { name: 'INT' },
        nullable: true,
        ordinal: 0,
      }),
      createErdColumn({
        id: 'c3',
        physicalName: 'amount',
        dataType: { name: 'DECIMAL', precision: 10, scale: 2 },
        nullable: true,
        ordinal: 2,
        comment: "금액 '원'",
      }),
    ],
  })
  return createErdProject({
    tables: [child, parent],
    keys: [
      createErdKey({ tableId: parent.id, type: 'primary', columnIds: ['p1', 'p2'] }),
    ],
    relations: [
      createErdRelation({
        sourceTableId: 'child',
        targetTableId: 'parent',
        cardinality: 'one-to-one',
        columnMappings: [
          { sourceColumnId: 'c2', targetColumnId: 'p2', ordinal: 1 },
          { sourceColumnId: 'c1', targetColumnId: 'p1', ordinal: 0 },
        ],
      }),
    ],
  })
}

describe('MySQL DDL', () => {
  it('exports hidden tables, ordered composite keys, cardinality and escaped comments without mutation', () => {
    const project = fixture()
    const before = structuredClone(project)
    const ddl = exportMysqlDdl(project)
    expect(ddl).toContain("`amount` DECIMAL(10, 2) NULL COMMENT '금액 ''원'''")
    expect(ddl).toContain("COMMENT='고객''s \\경로'")
    expect(ddl).toContain('PRIMARY KEY (`tenant_id`, `id`)')
    expect(ddl).toContain('UNIQUE KEY (`tenant_id`, `parent_id`)')
    expect(ddl).toContain(
      'FOREIGN KEY (`tenant_id`, `parent_id`) REFERENCES `parents` (`tenant_id`, `id`)',
    )
    expect(ddl.indexOf('ALTER TABLE')).toBeGreaterThan(
      ddl.indexOf('CREATE TABLE `parents`'),
    )
    expect(ddl).toContain('NO_BACKSLASH_ESCAPES')
    expect(ddl).toContain('SET SESSION sql_mode = @nerd_previous_sql_mode;')
    expect(project).toEqual(before)
  })

  it('supports self references and cycles by adding every FK after CREATE TABLE', () => {
    const project = fixture()
    project.keys.push(
      createErdKey({ tableId: 'child', type: 'unique', columnIds: ['c1', 'c2'] }),
    )
    project.relations.push(
      createErdRelation({
        sourceTableId: 'parent',
        targetTableId: 'child',
        cardinality: 'one-to-many',
        columnMappings: [
          { sourceColumnId: 'p1', targetColumnId: 'c1', ordinal: 0 },
          { sourceColumnId: 'p2', targetColumnId: 'c2', ordinal: 1 },
        ],
      }),
    )
    project.relations.push(
      createErdRelation({
        sourceTableId: 'parent',
        targetTableId: 'parent',
        cardinality: 'one-to-many',
        columnMappings: [
          { sourceColumnId: 'p1', targetColumnId: 'p1', ordinal: 0 },
          { sourceColumnId: 'p2', targetColumnId: 'p2', ordinal: 1 },
        ],
      }),
    )
    const ddl = exportMysqlDdl(project)
    expect(ddl.match(/ALTER TABLE/g)).toHaveLength(3)
    expect(ddl.lastIndexOf('CREATE TABLE')).toBeLessThan(ddl.indexOf('ALTER TABLE'))
  })

  it('rejects incomplete models, orphan references, incompatible types and oversized keys', () => {
    expect(() => exportMysqlDdl(createErdProject())).toThrow('테이블')
    expect(() =>
      exportMysqlDdl(createErdProject({ tables: [createErdTable()] })),
    ).toThrow('컬럼')
    const project = fixture()
    project.keys = []
    expect(() => exportMysqlDdl(project)).toThrow('primary/unique')
    const incompatible = fixture()
    incompatible.tables[0]!.columns[0]!.dataType.unsigned = false
    expect(() => exportMysqlDdl(incompatible)).toThrow('UNSIGNED')
    const oversized = fixture()
    oversized.tables[1]!.columns[0]!.dataType = { name: 'VARCHAR', length: 1000 }
    oversized.tables[0]!.columns[1]!.dataType = { name: 'VARCHAR', length: 1000 }
    expect(getMysqlExportIssues(oversized).join(' ')).toContain('3072')
  })
})
