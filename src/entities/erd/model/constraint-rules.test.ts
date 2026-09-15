import {
  createErdColumn,
  createErdKey,
  createErdProject,
  createErdRelation,
  createErdTable,
} from './factory'
import { validateErdProject } from './validation'
import { removeErdColumnFromTable, removeErdTableFromProject } from './editor-actions'

function fixture() {
  const column = createErdColumn({
    id: 'id',
    physicalName: 'id',
    nullable: false,
    dataType: { name: 'BIGINT' },
  })
  const tables = [
    createErdTable({ id: 'a', physicalName: 'a', columns: [column] }),
    createErdTable({ id: 'b', physicalName: 'b', columns: [column] }),
  ]
  return createErdProject({
    tables,
    keys: [createErdKey({ tableId: 'a', type: 'primary', columnIds: ['id'] })],
    relations: [
      createErdRelation({
        sourceTableId: 'b',
        targetTableId: 'a',
        cardinality: 'one-to-many',
        columnMappings: [{ sourceColumnId: 'id', targetColumnId: 'id', ordinal: 0 }],
      }),
    ],
  })
}

it('reports incompatible FK types, nullable PKs and duplicate identifiers', () => {
  const project = fixture()
  project.tables[0]!.columns[0]!.nullable = true
  project.tables[1]!.columns[0]!.dataType = { name: 'INT' }
  project.relations.push(project.relations[0]!)
  const codes = validateErdProject(project).map((issue) => issue.code)
  expect(codes).toEqual(
    expect.arrayContaining([
      'invalid-key-column',
      'incompatible-relation-column',
      'duplicate-id',
    ]),
  )
})

it('cleans dependent relations on table or referenced column deletion and preserves other tables', () => {
  const project = fixture()
  const deletedColumn = removeErdColumnFromTable(project, 'a', 'id')
  expect(deletedColumn.keys).toEqual([])
  expect(deletedColumn.relations).toEqual([])
  expect(deletedColumn.tables[1]?.columns).toHaveLength(1)
  expect(validateErdProject(deletedColumn)).toEqual([])
  const deletedTable = removeErdTableFromProject(project, 'a')
  expect(deletedTable.tables).toHaveLength(1)
  expect(deletedTable.relations).toEqual([])
  expect(project.tables).toHaveLength(2)
})
