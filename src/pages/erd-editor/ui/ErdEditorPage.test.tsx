import { screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { ErdEditorPage } from './ErdEditorPage'

describe('ErdEditorPage', () => {
  beforeEach(() => {
    useErdEditorStore.getState().resetProject()
  })

  it('shows an empty ERD editor and reflects a drawn table', () => {
    renderWithClient(<ErdEditorPage />)

    expect(screen.getByRole('heading', { name: 'ERD 편집기' })).toBeInTheDocument()
    expect(screen.getByText('테이블 0개')).toBeInTheDocument()
    expect(screen.getByText(/선택 없음/)).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: '테이블 추가' })).not.toBeInTheDocument()
    act(() => {
      useErdEditorStore
        .getState()
        .addTable({ position: { x: 40, y: 50 }, size: { width: 360, height: 180 } })
    })

    const tableNode = screen.getByTestId('erd-table-node-table_1')

    expect(tableNode).toBeInTheDocument()
    expect(screen.getByText('테이블 1개')).toBeInTheDocument()
    expect(within(tableNode).getByDisplayValue('table_1')).toBeInTheDocument()
  })

  it('edits table metadata, rejects duplicate names, and confirms deletion', async () => {
    const user = userEvent.setup()
    useErdEditorStore.getState().addTable({ physicalName: 'users' })
    useErdEditorStore.getState().addTable()
    renderWithClient(<ErdEditorPage />)
    const name = screen.getByLabelText('테이블 물리명')
    await user.clear(name)
    await user.type(name, 'users')
    expect(screen.getByRole('alert')).toHaveTextContent('중복')
    await user.clear(name)
    await user.type(name, 'orders')
    expect(screen.getByTestId('erd-table-node-orders')).toBeInTheDocument()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await user.click(screen.getByRole('button', { name: '테이블 삭제' }))
    expect(screen.getByTestId('erd-table-node-orders')).toBeInTheDocument()
    confirm.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: '테이블 삭제' }))
    expect(screen.queryByTestId('erd-table-node-orders')).not.toBeInTheDocument()
    confirm.mockRestore()
  })

  it('shows selected table details and applied composite keys using the name display mode', async () => {
    const user = userEvent.setup()
    const store = useErdEditorStore.getState()
    const first = store.addTable({ physicalName: 'users', logicalName: '사용자' })
    const one = store.addColumn(first.id, {
      physicalName: 'tenant_id',
      logicalName: '조직',
      dataType: { name: 'BIGINT' },
      nullable: false,
    })!
    const two = store.addColumn(first.id, {
      physicalName: 'id',
      logicalName: '번호',
      dataType: { name: 'BIGINT' },
      nullable: false,
    })!
    store.upsertKey({ tableId: first.id, type: 'primary', columnIds: [two.id, one.id] })
    const second = store.addTable({ physicalName: 'orders', logicalName: '주문' })
    store.selectTable(first.id)
    renderWithClient(<ErdEditorPage />)
    const details = within(
      screen.getByRole('complementary', { name: '테이블 상세 패널' }),
    )
    expect(details.getByLabelText('테이블 물리명')).toHaveValue('users')
    expect(details.getByText('복합 PK')).toBeInTheDocument()
    const applied = within(details.getByRole('region', { name: '적용된 키 정보' }))
    expect(applied.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'PK 1 · 번호 · id',
      'PK 2 · 조직 · tenant_id',
    ])
    await user.click(screen.getByRole('button', { name: '논리명 표시' }))
    expect(details.queryByLabelText('테이블 물리명')).not.toBeInTheDocument()
    expect(details.queryByLabelText('컬럼 물리명')).not.toBeInTheDocument()
    expect(applied.getByText('PK 1 · 번호')).toBeInTheDocument()
    act(() => store.selectTable(second.id))
    expect(details.getByLabelText('테이블 논리명')).toHaveValue('주문')
    expect(details.getByText('PK 없음')).toBeInTheDocument()
  })
})
