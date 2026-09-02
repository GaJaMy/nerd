import { create } from 'zustand'
import {
  createErdProject,
  createErdTable,
  createUniqueTablePhysicalName,
} from './factory'
import { type CanvasPosition, type ErdProject, type ErdTable } from './schema'

type ErdEditorStore = {
  addTable: () => ErdTable
  moveTable: (tableId: string, position: CanvasPosition) => void
  project: ErdProject
  resetProject: () => void
  selectTable: (tableId: string | null) => void
  selectedTableId: string | null
}

export const useErdEditorStore = create<ErdEditorStore>((set, get) => ({
  ...createInitialEditorState(),
  addTable: () => {
    const { project } = get()
    const table = createErdTable({
      physicalName: createUniqueTablePhysicalName(project.tables),
      position: createNextTablePosition(project.tables.length),
    })

    set({
      project: {
        ...project,
        tables: [...project.tables, table],
      },
      selectedTableId: table.id,
    })

    return table
  },
  moveTable: (tableId, position) => {
    set(({ project }) => ({
      project: {
        ...project,
        tables: project.tables.map((table) =>
          table.id === tableId ? { ...table, position } : table,
        ),
      },
    }))
  },
  resetProject: () => {
    set(createInitialEditorState())
  },
  selectTable: (tableId) => {
    set({ selectedTableId: tableId })
  },
}))

function createInitialEditorState() {
  return {
    project: createErdProject(),
    selectedTableId: null,
  }
}

function createNextTablePosition(tableIndex: number): CanvasPosition {
  return {
    x: 80 + (tableIndex % 3) * 320,
    y: 80 + Math.floor(tableIndex / 3) * 220,
  }
}
