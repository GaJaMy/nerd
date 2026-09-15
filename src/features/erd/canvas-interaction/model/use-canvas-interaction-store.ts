import { create } from 'zustand'
import { useErdEditorStore } from '@/entities/erd/model'

type BaseMode = 'draw' | 'pan'
type RelationDraft = {
  relationId: string | null
  sourceTableId: string | null
  targetTableId: string | null
}

type CanvasInteractionStore = {
  mode: BaseMode | 'relation'
  returnMode: BaseMode
  relationDraft: RelationDraft | null
  setMode: (mode: BaseMode) => void
  beginRelation: (relationId?: string) => void
  pickRelationTable: (tableId: string) => void
  cancelRelation: () => void
}

export const useCanvasInteractionStore = create<CanvasInteractionStore>((set, get) => ({
  mode: 'draw',
  returnMode: 'draw',
  relationDraft: null,
  setMode: (mode) => set({ mode, returnMode: mode, relationDraft: null }),
  beginRelation: (relationId) => {
    const { mode, returnMode } = get()
    set({
      mode: 'relation',
      returnMode: mode === 'relation' ? returnMode : mode,
      relationDraft: {
        relationId: relationId ?? null,
        sourceTableId: null,
        targetTableId: null,
      },
    })
  },
  pickRelationTable: (tableId) => {
    const { mode, relationDraft, returnMode } = get()
    if (mode !== 'relation' || !relationDraft) return
    if (
      !useErdEditorStore
        .getState()
        .project.tables.some((table) => table.id === tableId && !table.hidden)
    )
      return
    if (!relationDraft.sourceTableId)
      set({ relationDraft: { ...relationDraft, sourceTableId: tableId } })
    else
      set({
        mode: returnMode,
        relationDraft: { ...relationDraft, targetTableId: tableId },
      })
  },
  cancelRelation: () => set({ mode: get().returnMode, relationDraft: null }),
}))

/** Connect volatile interaction state to domain lifecycle while the editor is mounted. */
export function subscribeToRelationEndpoints() {
  return useErdEditorStore.subscribe(({ project }, previous) => {
    const { relationDraft, cancelRelation } = useCanvasInteractionStore.getState()
    if (!relationDraft) return
    const missingTable = [relationDraft.sourceTableId, relationDraft.targetTableId].some(
      (id) =>
        id !== null && !project.tables.some((table) => table.id === id && !table.hidden),
    )
    const missingRelation =
      relationDraft.relationId !== null &&
      !project.relations.some((relation) => relation.id === relationDraft.relationId)
    if (missingTable || missingRelation || project.id !== previous.project.id)
      cancelRelation()
  })
}
