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

it('only enters canvas editing on double click or keyboard and exits without saving invalid drafts', async () => {
  const user = userEvent.setup()
  const store = useErdEditorStore.getState()
  store.resetProject()
  const table = store.addTable({ physicalName: 'users' })
  renderWithClient(
    <>
      <ErdNameInput
        tableId={table.id}
        field="physicalName"
        label="캔버스"
        editOnDoubleClick
      />
      <ErdNameInput tableId={table.id} field="physicalName" label="패널" />
    </>,
  )
  await user.click(screen.getByRole('button', { name: '캔버스' }))
  expect(screen.queryByRole('textbox', { name: '캔버스' })).not.toBeInTheDocument()
  await user.dblClick(screen.getByRole('button', { name: '캔버스' }))
  const input = screen.getByRole('textbox', { name: '캔버스' })
  expect(input).toHaveFocus()
  fireEvent.change(input, { target: { value: 'members' } })
  expect(screen.getByLabelText('패널')).toHaveValue('members')
  await user.keyboard('{Enter}')
  expect(screen.getByRole('button', { name: '캔버스' })).toHaveTextContent('members')
  screen.getByRole('button', { name: '캔버스' }).focus()
  await user.keyboard('{F2}')
  await user.clear(screen.getByRole('textbox', { name: '캔버스' }))
  expect(screen.getByRole('alert')).toBeInTheDocument()
  await user.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: '캔버스' })).toHaveTextContent('members')
  await user.dblClick(screen.getByRole('button', { name: '캔버스' }))
  await user.clear(screen.getByRole('textbox', { name: '캔버스' }))
  await user.click(screen.getByLabelText('패널'))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '캔버스' })).toHaveTextContent('members')
})

it('keeps the canvas editor open during IME confirmation and synchronizes the composed name', async () => {
  const user = userEvent.setup()
  const store = useErdEditorStore.getState()
  store.resetProject()
  const table = store.addTable()
  renderWithClient(
    <ErdNameInput
      tableId={table.id}
      field="logicalName"
      label="논리명"
      editOnDoubleClick
    />,
  )
  await user.dblClick(screen.getByRole('button', { name: '논리명' }))
  const input = screen.getByRole('textbox')
  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '회' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
  expect(screen.getByRole('textbox')).toBe(input)
  expect(useErdEditorStore.getState().project.tables[0]?.logicalName).toBeUndefined()
  fireEvent.compositionEnd(input, { target: { value: '회원' } })
  await user.keyboard('{Enter}')
  expect(screen.getByRole('button', { name: '논리명' })).toHaveTextContent('회원')
})
