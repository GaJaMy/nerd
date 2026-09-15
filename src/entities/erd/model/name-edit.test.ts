import { createErdColumn, createErdProject, createErdTable } from './factory'
import { validateNameEdit } from './name-edit'

it('validates names within the correct table or column scope', () => {
  const table = createErdTable({
    id: 'a',
    physicalName: 'users',
    columns: [
      createErdColumn({
        id: 'id',
        physicalName: 'id',
        dataType: { name: 'INT' },
        nullable: false,
      }),
      createErdColumn({
        id: 'name',
        physicalName: 'name',
        dataType: { name: 'TEXT' },
        nullable: true,
      }),
    ],
  })
  const project = createErdProject({
    tables: [table, createErdTable({ id: 'b', physicalName: 'orders' })],
  })
  expect(validateNameEdit(project, 'a', undefined, 'physicalName', 'ORDERS')).toContain(
    '중복',
  )
  expect(validateNameEdit(project, 'a', 'name', 'physicalName', 'ID')).toContain('중복')
  expect(validateNameEdit(project, 'a', 'id', 'physicalName', 'id')).toBe('')
  expect(validateNameEdit(project, 'a', 'id', 'physicalName', '9bad')).not.toBe('')
  expect(validateNameEdit(project, 'a', undefined, 'logicalName', '')).toBe('')
})
