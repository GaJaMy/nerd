import {
  displayOptionsSchema,
  erdColumnSchema,
  erdProjectSchema,
  erdTableSchema,
  type CanvasPosition,
  type CanvasViewport,
  type DisplayOptions,
  type ErdColumn,
  type ErdProject,
  type ErdRelation,
  type ErdTable,
  type MysqlDataType,
} from './schema'

export type CreateErdProjectInput = {
  displayOptions?: DisplayOptions
  id?: string
  name?: string
  relations?: ErdRelation[]
  tables?: ErdTable[]
  viewport?: CanvasViewport
}

export type CreateErdTableInput = {
  columns?: ErdColumn[]
  comment?: string
  hidden?: boolean
  id?: string
  logicalName?: string
  physicalName?: string
  position?: CanvasPosition
}

export type CreateErdColumnInput = {
  comment?: string
  dataType: MysqlDataType
  defaultValue?: string
  id?: string
  logicalName?: string
  nullable: boolean
  ordinal?: number
  physicalName: string
}

export function createDefaultDisplayOptions(): DisplayOptions {
  return displayOptionsSchema.parse({
    showComment: true,
    showDataType: true,
    showHiddenTables: false,
    showLogicalName: true,
    showPhysicalName: true,
  })
}

export function createDefaultCanvasViewport(): CanvasViewport {
  return {
    x: 0,
    y: 0,
    zoom: 1,
  }
}

export function createErdProject(input: CreateErdProjectInput = {}): ErdProject {
  return erdProjectSchema.parse({
    displayOptions: input.displayOptions ?? createDefaultDisplayOptions(),
    id: input.id ?? createId('project'),
    name: input.name ?? '새 ERD 프로젝트',
    relations: input.relations ?? [],
    tables: input.tables ?? [],
    viewport: input.viewport ?? createDefaultCanvasViewport(),
  })
}

export function createErdTable(input: CreateErdTableInput = {}): ErdTable {
  return erdTableSchema.parse({
    columns: input.columns ?? [],
    hidden: input.hidden ?? false,
    id: input.id ?? createId('table'),
    physicalName: input.physicalName ?? 'table_1',
    position: input.position ?? { x: 0, y: 0 },
    ...(input.comment === undefined ? {} : { comment: input.comment }),
    ...(input.logicalName === undefined ? {} : { logicalName: input.logicalName }),
  })
}

export function createErdColumn(input: CreateErdColumnInput): ErdColumn {
  return erdColumnSchema.parse({
    dataType: input.dataType,
    id: input.id ?? createId('column'),
    nullable: input.nullable,
    ordinal: input.ordinal ?? 0,
    physicalName: input.physicalName,
    ...(input.comment === undefined ? {} : { comment: input.comment }),
    ...(input.defaultValue === undefined ? {} : { defaultValue: input.defaultValue }),
    ...(input.logicalName === undefined ? {} : { logicalName: input.logicalName }),
  })
}

export function createUniqueTablePhysicalName(tables: ErdTable[]) {
  const usedNames = new Set(tables.map((table) => table.physicalName.toLowerCase()))
  let index = 1
  let physicalName = `table_${index}`

  while (usedNames.has(physicalName.toLowerCase())) {
    index += 1
    physicalName = `table_${index}`
  }

  return physicalName
}

function createId(prefix: string) {
  const randomId =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)

  return `${prefix}_${randomId}`
}
