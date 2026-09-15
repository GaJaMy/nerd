import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { ErdValidation } from './ErdValidation'

it('opens the invalid relation after its target key is removed', async () => {
  const user = userEvent.setup()
  const store = useErdEditorStore.getState()
  store.resetProject()
  const table = store.addTable()
  const column = store.addColumn(table.id, {
    physicalName: 'id',
    nullable: false,
    dataType: { name: 'INT' },
  })!
  const key = store.upsertKey({
    tableId: table.id,
    type: 'primary',
    columnIds: [column.id],
  })!
  const relation = store.addRelation({
    sourceTableId: table.id,
    targetTableId: table.id,
    cardinality: 'one-to-many',
    columnMappings: [
      { sourceColumnId: column.id, targetColumnId: column.id, ordinal: 0 },
    ],
  })!
  store.deleteKey(key.id)
  store.selectRelation(null)
  renderWithClient(<ErdValidation />)
  expect(screen.getByRole('alert')).toHaveTextContent('primary/unique')
  await user.click(screen.getByRole('button', { name: '관련 항목 편집' }))
  expect(useErdEditorStore.getState().selectedRelationId).toBe(relation.id)
})
