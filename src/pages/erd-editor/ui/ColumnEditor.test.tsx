import { screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useErdEditorStore } from '@/entities/erd/model'
import { renderWithClient } from '@/shared/testing/render'
import { ErdEditorPage } from './ErdEditorPage'

describe('column and primary key editing', () => {
  it('edits column details and sets ordered composite primary keys', async () => {
    const user = userEvent.setup()
    useErdEditorStore.getState().resetProject()
    const table = useErdEditorStore.getState().addTable()
    useErdEditorStore.getState().addColumn(table.id)
    useErdEditorStore.getState().addColumn(table.id)
    renderWithClient(<ErdEditorPage />)
    const form = within(screen.getByRole('form', { name: '컬럼 column_1 편집' }))
    await user.type(form.getByLabelText('컬럼 논리명'), '식별자')
    await user.type(form.getByLabelText('컬럼 코멘트'), '고객 번호')
    await user.click(form.getByRole('button', { name: '컬럼 적용' }))
    const keyPanel = within(screen.getByRole('region', { name: '기본키 설정' }))
    await user.click(keyPanel.getByLabelText('column_2'))
    await user.click(keyPanel.getByLabelText('column_1'))
    await user.click(keyPanel.getByRole('button', { name: '기본키 적용' }))
    const project = useErdEditorStore.getState().project
    expect(project.keys[0]?.columnIds).toEqual(
      project.tables[0]?.columns.map((column) => column.id).reverse(),
    )
    expect(project.tables[0]?.columns.every((column) => !column.nullable)).toBe(true)
    expect(project.tables[0]?.columns[0]).toMatchObject({
      logicalName: '식별자',
      comment: '고객 번호',
    })
    const columnId = project.tables[0]!.columns[0]!.id
    act(() =>
      useErdEditorStore.getState().updateColumn(table.id, columnId, { nullable: true }),
    )
    expect(useErdEditorStore.getState().project.tables[0]?.columns[0]?.nullable).toBe(
      false,
    )
  })
})
