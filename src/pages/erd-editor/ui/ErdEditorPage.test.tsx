import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { ErdEditorPage } from './ErdEditorPage'

describe('ErdEditorPage', () => {
  beforeEach(() => {
    useErdEditorStore.getState().resetProject()
  })

  it('shows an empty ERD editor and adds a table to the canvas', async () => {
    const user = userEvent.setup()

    renderWithClient(<ErdEditorPage />)

    expect(screen.getByRole('heading', { name: 'ERD 편집기' })).toBeInTheDocument()
    expect(screen.getByText('테이블 0개')).toBeInTheDocument()
    expect(screen.getByText('선택 없음')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '테이블 추가' }))

    const tableNode = screen.getByTestId('erd-table-node-table_1')

    expect(tableNode).toBeInTheDocument()
    expect(screen.getByText('테이블 1개')).toBeInTheDocument()
    expect(within(tableNode).getByText('table_1')).toBeInTheDocument()
  })
})
