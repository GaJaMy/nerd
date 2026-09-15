import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { ErdNameInput } from './ErdNameInput'

it('synchronizes valid edits and keeps invalid or composing drafts out of the model', async () => {
  const user = userEvent.setup()
  const store = useErdEditorStore.getState()
  store.resetProject()
  const table = store.addTable({ physicalName: 'users' })
  store.addTable({ physicalName: 'orders' })
  renderWithClient(
    <>
      <ErdNameInput tableId={table.id} field="physicalName" label="캔버스" />
      <ErdNameInput tableId={table.id} field="physicalName" label="패널" />
      <ErdNameInput tableId={table.id} field="logicalName" label="논리명" />
    </>,
  )
  const input = screen.getByLabelText('캔버스')
  await user.clear(input)
  expect(useErdEditorStore.getState().project.tables[0]?.physicalName).toBe('users')
  fireEvent.change(input, { target: { value: 'orders' } })
  expect(screen.getByRole('alert')).toHaveTextContent('중복')
  await user.keyboard('{Escape}')
  expect(input).toHaveValue('users')
  fireEvent.change(input, { target: { value: 'customers' } })
  expect(screen.getByLabelText('패널')).toHaveValue('customers')
  act(() => store.updateTable(table.id, { physicalName: 'members' }))
  expect(input).toHaveValue('members')
  const logical = screen.getByLabelText('논리명')
  fireEvent.compositionStart(logical)
  fireEvent.change(logical, { target: { value: '회' } })
  expect(useErdEditorStore.getState().project.tables[0]?.logicalName).toBeUndefined()
  fireEvent.compositionEnd(logical, { target: { value: '회원' } })
  expect(useErdEditorStore.getState().project.tables[0]?.logicalName).toBe('회원')
})
