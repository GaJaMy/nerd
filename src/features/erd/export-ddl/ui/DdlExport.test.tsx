import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { DdlExport } from './DdlExport'

it('shows export blockers and copies valid DDL with a recoverable clipboard failure', async () => {
  const user = userEvent.setup()
  const store = useErdEditorStore.getState()
  store.resetProject()
  renderWithClient(<DdlExport />)
  await user.click(screen.getByRole('button', { name: 'MySQL DDL 내보내기' }))
  expect(screen.getByRole('alert')).toHaveTextContent('테이블')
  await user.click(screen.getByRole('button', { name: 'MySQL DDL 닫기' }))
  // Populate the next render with a valid export model.
  const { act } = await import('@testing-library/react')
  act(() => {
    const table = store.addTable()
    store.addColumn(table.id, {
      physicalName: 'id',
      dataType: { name: 'INT' },
      nullable: true,
    })
  })
  await user.click(screen.getByRole('button', { name: 'MySQL DDL 내보내기' }))
  expect(screen.getByLabelText<HTMLTextAreaElement>('MySQL DDL').value).toContain(
    'CREATE TABLE',
  )
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
  await user.click(screen.getByRole('button', { name: 'DDL 복사' }))
  expect(copy).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'))
  copy.mockRejectedValue(new Error('denied'))
  await user.click(screen.getByRole('button', { name: 'DDL 복사' }))
  expect(screen.getByRole('status')).toHaveTextContent('다운로드')
  vi.restoreAllMocks()
})
