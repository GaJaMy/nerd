import { createErdColumn, createErdRelation, createErdTable } from '@/entities/erd/model'
import { toErdRelationFlowEdges } from './erd-flow-adapter'

it('labels relationship direction and ordered mappings, and excludes hidden endpoints', () => {
  const column = createErdColumn({
    id: 'id',
    physicalName: 'id',
    nullable: false,
    dataType: { name: 'INT' },
  })
  const tables = [
    createErdTable({ id: 'child', columns: [column] }),
    createErdTable({ id: 'parent', columns: [column] }),
  ]
  const relation = createErdRelation({
    sourceTableId: 'child',
    targetTableId: 'parent',
    cardinality: 'one-to-many',
    columnMappings: [{ sourceColumnId: 'id', targetColumnId: 'id', ordinal: 0 }],
  })
  expect(toErdRelationFlowEdges(tables, [relation], relation.id)[0]).toMatchObject({
    source: 'child',
    target: 'parent',
    selected: true,
    label: '관계 · N:1 · id → id',
  })
  expect(
    toErdRelationFlowEdges(
      tables.map((table) => ({ ...table, hidden: true })),
      [relation],
      null,
    ),
  ).toEqual([])
})
