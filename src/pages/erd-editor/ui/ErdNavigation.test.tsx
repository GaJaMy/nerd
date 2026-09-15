import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { ErdEditorPage } from './ErdEditorPage'

it('finds hidden tables by logical name, restores them, and independently hides column details', async () => {
  const user = userEvent.setup()
  const store = useErdEditorStore.getState()
  store.resetProject()
  const table = store.addTable({
    physicalName: 'users',
    logicalName: '사용자',
    hidden: true,
  })
  store.addColumn(table.id, {
    physicalName: 'id',
    logicalName: '식별자',
    comment: '사용자 번호',
    nullable: true,
    dataType: { name: 'INT' },
  })
  renderWithClient(<ErdEditorPage />)
  expect(screen.queryByTestId('erd-table-node-users')).not.toBeInTheDocument()
  await user.type(screen.getByLabelText('테이블 검색'), '사용자')
  await user.click(screen.getByRole('button', { name: 'users · 사용자 (숨김)' }))
  const node = within(screen.getByTestId('erd-table-node-users'))
  expect(node.getByText('사용자 번호')).toBeInTheDocument()
  await user.click(screen.getByLabelText('코멘트 표시'))
  await user.selectOptions(screen.getByLabelText('이름 표시'), 'logical')
  expect(node.queryByText('사용자 번호')).not.toBeInTheDocument()
  expect(node.queryByText('id')).not.toBeInTheDocument()
  expect(node.getByText('식별자')).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('이름 표시'), 'physical')
  expect(node.getByText('users')).toBeInTheDocument()
  expect(node.queryByText('식별자')).not.toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('이름 표시'), 'both')
  expect(node.getByText('식별자')).toBeInTheDocument()
  expect(node.getByText('id')).toBeInTheDocument()
})
