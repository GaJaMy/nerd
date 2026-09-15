import { useErdEditorStore } from '@/entities/erd/model'
import {
  subscribeToRelationEndpoints,
  useCanvasInteractionStore,
} from './use-canvas-interaction-store'

beforeEach(() => {
  useErdEditorStore.getState().resetProject()
  useCanvasInteractionStore.getState().setMode('draw')
})

it('picks FK owner first, allows self references and returns to the previous mode', () => {
  const table = useErdEditorStore.getState().addTable()
  const interaction = useCanvasInteractionStore.getState()
  interaction.setMode('pan')
  interaction.beginRelation()
  interaction.pickRelationTable('missing')
  expect(useCanvasInteractionStore.getState().relationDraft?.sourceTableId).toBeNull()
  interaction.pickRelationTable(table.id)
  expect(useCanvasInteractionStore.getState().mode).toBe('relation')
  interaction.pickRelationTable(table.id)
  expect(useCanvasInteractionStore.getState()).toMatchObject({
    mode: 'pan',
    relationDraft: { sourceTableId: table.id, targetTableId: table.id },
  })
  expect(useErdEditorStore.getState().project.relations).toHaveLength(0)
  interaction.cancelRelation()
  expect(useCanvasInteractionStore.getState().relationDraft).toBeNull()
})

it('cancels on hidden/deleted endpoints, reset and tool changes', () => {
  const unsubscribe = subscribeToRelationEndpoints()
  try {
    const store = useErdEditorStore.getState()
    const first = store.addTable(),
      second = store.addTable()
    const interaction = useCanvasInteractionStore.getState()
    interaction.beginRelation()
    interaction.pickRelationTable(first.id)
    store.setTableHidden(first.id, true)
    expect(useCanvasInteractionStore.getState().relationDraft).toBeNull()
    store.setTableHidden(first.id, false)
    interaction.beginRelation()
    interaction.pickRelationTable(first.id)
    interaction.pickRelationTable(second.id)
    store.deleteTable(second.id)
    expect(useCanvasInteractionStore.getState().relationDraft).toBeNull()
    interaction.beginRelation()
    store.resetProject()
    expect(useCanvasInteractionStore.getState().mode).toBe('draw')
    interaction.beginRelation()
    interaction.setMode('pan')
    expect(useCanvasInteractionStore.getState().relationDraft).toBeNull()
  } finally {
    unsubscribe()
  }
})
