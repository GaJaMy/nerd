import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { ErdEditorPage } from './ErdEditorPage'

it('creates and edits a composite relation, rejects duplicate mappings, and deletes only the relation', async () => {
  const user = userEvent.setup()
  const store = useErdEditorStore.getState()
  store.resetProject()
  const parent = store.addTable({ physicalName: 'parents' })
  const child = store.addTable({ physicalName: 'children' })
  const add = (tableId: string, physicalName: string) =>
    store.addColumn(tableId, {
      physicalName,
      dataType: { name: 'BIGINT' },
      nullable: false,
    })!
  const p1 = add(parent.id, 'tenant_id'),
    p2 = add(parent.id, 'id')
  const c1 = add(child.id, 'tenant_id'),
    c2 = add(child.id, 'parent_id')
  store.upsertKey({ tableId: parent.id, type: 'primary', columnIds: [p1.id, p2.id] })
  renderWithClient(<ErdEditorPage />)
  const panel = within(screen.getByRole('region', { name: '관계 설정' }))
  await user.selectOptions(panel.getByLabelText('FK 소유 테이블'), child.id)
  await user.selectOptions(panel.getByLabelText('참조 대상 테이블'), parent.id)
  await user.selectOptions(panel.getByLabelText('FK 1 → tenant_id'), c1.id)
  await user.selectOptions(panel.getByLabelText('FK 2 → id'), c1.id)
  await user.click(panel.getByRole('button', { name: '관계 추가' }))
  expect(panel.getByRole('alert')).toHaveTextContent('중복')
  await user.selectOptions(panel.getByLabelText('FK 2 → id'), c2.id)
  await user.click(panel.getByRole('button', { name: '관계 추가' }))
  expect(
    useErdEditorStore
      .getState()
      .project.relations[0]?.columnMappings.map((item) => item.sourceColumnId),
  ).toEqual([c1.id, c2.id])
  await user.selectOptions(panel.getByLabelText('관계 종류'), 'one-to-one')
  await user.click(panel.getByRole('button', { name: '관계 적용' }))
  expect(useErdEditorStore.getState().project.relations[0]?.cardinality).toBe(
    'one-to-one',
  )
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  await user.click(panel.getByRole('button', { name: '관계 삭제' }))
  expect(useErdEditorStore.getState().project.relations).toHaveLength(0)
  expect(useErdEditorStore.getState().project.keys).toHaveLength(1)
  expect(useErdEditorStore.getState().project.tables[1]?.columns).toHaveLength(2)
  vi.restoreAllMocks()
})
