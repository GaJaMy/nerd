import { create } from 'zustand'
import {
  addErdColumnToTable,
  addErdRelationToProject,
  addErdTableToProject,
  moveErdTableInProject,
  removeErdColumnFromTable,
  removeErdKeyFromProject,
  removeErdRelationFromProject,
  removeErdTableFromProject,
  renameErdProject,
  setErdTableHiddenInProject,
  updateErdColumnInTable,
  updateErdKeyInProject,
  updateErdProjectDisplayOptions,
  updateErdProjectViewport,
  updateErdRelationInProject,
  updateErdTableInProject,
  upsertErdKeyInProject,
  type ErdColumnUpdate,
  type ErdKeyUpdate,
  type ErdRelationUpdate,
  type ErdTableUpdate,
} from './editor-actions'
import {
  createErdProject,
  type CreateErdColumnInput,
  type CreateErdKeyInput,
  type CreateErdRelationInput,
  type CreateErdTableInput,
} from './factory'
import {
  type CanvasPosition,
  type CanvasViewport,
  type DisplayOptions,
  type ErdColumn,
  type ErdKey,
  type ErdProject,
  type ErdRelation,
  type ErdTable,
} from './schema'
import { validateErdProject, type ErdValidationIssue } from './validation'

type ErdEditorSelection = {
  selectedColumnId: string | null
  selectedRelationId: string | null
  selectedTableId: string | null
}

export type ErdEditorStore = ErdEditorSelection & {
  addColumn: (tableId: string, input?: CreateErdColumnInput) => ErdColumn | null
  addRelation: (input: CreateErdRelationInput) => ErdRelation | null
  addTable: (input?: CreateErdTableInput) => ErdTable
  deleteColumn: (tableId: string, columnId: string) => void
  deleteKey: (keyId: string) => void
  deleteRelation: (relationId: string) => void
  deleteTable: (tableId: string) => void
  moveTable: (tableId: string, position: CanvasPosition) => void
  patchDisplayOptions: (displayOptions: Partial<DisplayOptions>) => void
  project: ErdProject
  renameProject: (name: string) => void
  resetProject: (project?: ErdProject) => void
  selectColumn: (tableId: string, columnId: string | null) => void
  selectRelation: (relationId: string | null) => void
  selectTable: (tableId: string | null) => void
  setTableHidden: (tableId: string, hidden: boolean) => void
  setViewport: (viewport: CanvasViewport) => void
  updateColumn: (tableId: string, columnId: string, update: ErdColumnUpdate) => void
  updateKey: (keyId: string, update: ErdKeyUpdate) => ErdKey | null
  updateRelation: (relationId: string, update: ErdRelationUpdate) => ErdRelation | null
  updateTable: (tableId: string, update: ErdTableUpdate) => void
  upsertKey: (input: CreateErdKeyInput) => ErdKey | null
  validationIssues: ErdValidationIssue[]
}

export const useErdEditorStore = create<ErdEditorStore>((set, get) => {
  const commitProject = (
    project: ErdProject,
    selection: Partial<ErdEditorSelection> = {},
  ) => {
    set({
      project,
      validationIssues: validateErdProject(project),
      ...selection,
    })
  }

  return {
    ...createInitialEditorState(),
    addColumn: (tableId, input) => {
      const result = addErdColumnToTable(get().project, tableId, input)

      if (result === null) {
        return null
      }

      commitProject(result.project, {
        selectedColumnId: result.column.id,
        selectedRelationId: null,
        selectedTableId: tableId,
      })

      return result.column
    },
    addRelation: (input) => {
      const result = addErdRelationToProject(get().project, input)

      if (result === null) {
        return null
      }

      commitProject(result.project, {
        selectedColumnId: null,
        selectedRelationId: result.relation.id,
        selectedTableId: null,
      })

      return result.relation
    },
    addTable: (input) => {
      const result = addErdTableToProject(get().project, input)

      commitProject(result.project, {
        selectedColumnId: null,
        selectedRelationId: null,
        selectedTableId: result.table.id,
      })

      return result.table
    },
    deleteColumn: (tableId, columnId) => {
      const selectedColumnId = get().selectedColumnId

      commitProject(removeErdColumnFromTable(get().project, tableId, columnId), {
        selectedColumnId: selectedColumnId === columnId ? null : selectedColumnId,
        selectedRelationId: null,
      })
    },
    deleteKey: (keyId) => {
      commitProject(removeErdKeyFromProject(get().project, keyId))
    },
    deleteRelation: (relationId) => {
      const selectedRelationId = get().selectedRelationId

      commitProject(removeErdRelationFromProject(get().project, relationId), {
        selectedRelationId: selectedRelationId === relationId ? null : selectedRelationId,
      })
    },
    deleteTable: (tableId) => {
      const selectedTableId = get().selectedTableId

      commitProject(removeErdTableFromProject(get().project, tableId), {
        selectedColumnId: null,
        selectedRelationId: null,
        selectedTableId: selectedTableId === tableId ? null : selectedTableId,
      })
    },
    moveTable: (tableId, position) => {
      commitProject(moveErdTableInProject(get().project, tableId, position))
    },
    patchDisplayOptions: (displayOptions) => {
      commitProject(updateErdProjectDisplayOptions(get().project, displayOptions))
    },
    renameProject: (name) => {
      commitProject(renameErdProject(get().project, name))
    },
    resetProject: (project) => {
      set(createInitialEditorState(project))
    },
    selectColumn: (tableId, columnId) => {
      set({
        selectedColumnId: columnId,
        selectedRelationId: null,
        selectedTableId: tableId,
      })
    },
    selectRelation: (relationId) => {
      set({
        selectedColumnId: null,
        selectedRelationId: relationId,
        selectedTableId: null,
      })
    },
    selectTable: (tableId) => {
      set({
        selectedColumnId: null,
        selectedRelationId: null,
        selectedTableId: tableId,
      })
    },
    setTableHidden: (tableId, hidden) => {
      const selectedTableId = get().selectedTableId

      commitProject(setErdTableHiddenInProject(get().project, tableId, hidden), {
        selectedColumnId: hidden ? null : get().selectedColumnId,
        selectedTableId: hidden && selectedTableId === tableId ? null : selectedTableId,
      })
    },
    setViewport: (viewport) => {
      set({ project: updateErdProjectViewport(get().project, viewport) })
    },
    updateColumn: (tableId, columnId, update) => {
      commitProject(updateErdColumnInTable(get().project, tableId, columnId, update))
    },
    updateKey: (keyId, update) => {
      const result = updateErdKeyInProject(get().project, keyId, update)

      if (result === null) {
        return null
      }

      commitProject(result.project)

      return result.key
    },
    updateRelation: (relationId, update) => {
      const result = updateErdRelationInProject(get().project, relationId, update)

      if (result === null) {
        return null
      }

      commitProject(result.project, {
        selectedRelationId: result.relation.id,
      })

      return result.relation
    },
    updateTable: (tableId, update) => {
      commitProject(updateErdTableInProject(get().project, tableId, update))
    },
    upsertKey: (input) => {
      const result = upsertErdKeyInProject(get().project, input)

      if (result === null) {
        return null
      }

      commitProject(result.project)

      return result.key
    },
  }
})

function createInitialEditorState(project = createErdProject()) {
  return {
    project,
    selectedColumnId: null,
    selectedRelationId: null,
    selectedTableId: null,
    validationIssues: validateErdProject(project),
  }
}
