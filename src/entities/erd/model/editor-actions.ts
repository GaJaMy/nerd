import {
  createErdColumn,
  createErdKey,
  createErdRelation,
  createErdTable,
  createUniqueTablePhysicalName,
  type CreateErdColumnInput,
  type CreateErdKeyInput,
  type CreateErdRelationInput,
  type CreateErdTableInput,
} from './factory'
import {
  erdColumnSchema,
  erdKeySchema,
  erdProjectSchema,
  erdRelationSchema,
  erdTableSchema,
  type CanvasPosition,
  type CanvasViewport,
  type DisplayOptions,
  type ErdColumn,
  type ErdKey,
  type ErdProject,
  type ErdRelation,
  type ErdTable,
} from './schema'

export type ErdTableUpdate = Partial<
  Pick<
    ErdTable,
    'comment' | 'hidden' | 'logicalName' | 'physicalName' | 'position' | 'size'
  >
>

export type ErdColumnUpdate = Partial<
  Pick<
    ErdColumn,
    | 'comment'
    | 'dataType'
    | 'defaultValue'
    | 'logicalName'
    | 'nullable'
    | 'ordinal'
    | 'physicalName'
  >
>

export type ErdKeyUpdate = Partial<
  Pick<ErdKey, 'columnIds' | 'name' | 'tableId' | 'type'>
>

export type ErdRelationUpdate = Partial<
  Pick<
    ErdRelation,
    | 'cardinality'
    | 'columnMappings'
    | 'hidden'
    | 'label'
    | 'sourceTableId'
    | 'targetTableId'
  >
>

export type ErdTableResult = {
  project: ErdProject
  table: ErdTable
}

export type ErdColumnResult = {
  column: ErdColumn
  project: ErdProject
}

export type ErdKeyResult = {
  key: ErdKey
  project: ErdProject
}

export type ErdRelationResult = {
  project: ErdProject
  relation: ErdRelation
}

export function renameErdProject(project: ErdProject, name: string): ErdProject {
  return parseProject({ ...project, name })
}

export function updateErdProjectViewport(
  project: ErdProject,
  viewport: CanvasViewport,
): ErdProject {
  return parseProject({ ...project, viewport })
}

export function updateErdProjectDisplayOptions(
  project: ErdProject,
  displayOptions: Partial<DisplayOptions>,
): ErdProject {
  return parseProject({
    ...project,
    displayOptions: {
      ...project.displayOptions,
      ...displayOptions,
    },
  })
}

export function addErdTableToProject(
  project: ErdProject,
  input: CreateErdTableInput = {},
): ErdTableResult {
  const table = createErdTable({
    ...input,
    physicalName: input.physicalName ?? createUniqueTablePhysicalName(project.tables),
    position: input.position ?? createNextTablePosition(project.tables.length),
  })

  return {
    project: parseProject({
      ...project,
      tables: [...project.tables, table],
    }),
    table,
  }
}

export function updateErdTableInProject(
  project: ErdProject,
  tableId: string,
  update: ErdTableUpdate,
): ErdProject {
  return parseProject({
    ...project,
    tables: project.tables.map((table) =>
      table.id === tableId ? erdTableSchema.parse({ ...table, ...update }) : table,
    ),
  })
}

export function removeErdTableFromProject(
  project: ErdProject,
  tableId: string,
): ErdProject {
  if (!project.tables.some((table) => table.id === tableId)) {
    return project
  }

  return parseProject({
    ...project,
    keys: project.keys.filter((key) => key.tableId !== tableId),
    relations: project.relations.filter(
      (relation) =>
        relation.sourceTableId !== tableId && relation.targetTableId !== tableId,
    ),
    tables: project.tables.filter((table) => table.id !== tableId),
  })
}

export function moveErdTableInProject(
  project: ErdProject,
  tableId: string,
  position: CanvasPosition,
): ErdProject {
  return updateErdTableInProject(project, tableId, { position })
}

export function setErdTableHiddenInProject(
  project: ErdProject,
  tableId: string,
  hidden: boolean,
): ErdProject {
  return updateErdTableInProject(project, tableId, { hidden })
}

export function addErdColumnToTable(
  project: ErdProject,
  tableId: string,
  input: CreateErdColumnInput,
): ErdColumnResult | null {
  const table = findTable(project, tableId)

  if (table === undefined) {
    return null
  }

  const column = createErdColumn({
    ...input,
    ordinal: input.ordinal ?? createNextColumnOrdinal(table.columns),
  })

  return {
    column,
    project: replaceTable(project, {
      ...table,
      columns: sortColumnsByOrdinal([...table.columns, column]),
    }),
  }
}

export function updateErdColumnInTable(
  project: ErdProject,
  tableId: string,
  columnId: string,
  update: ErdColumnUpdate,
): ErdProject {
  const table = findTable(project, tableId)

  if (table === undefined) {
    return project
  }

  return replaceTable(project, {
    ...table,
    columns: sortColumnsByOrdinal(
      table.columns.map((column) =>
        column.id === columnId ? erdColumnSchema.parse({ ...column, ...update }) : column,
      ),
    ),
  })
}

export function removeErdColumnFromTable(
  project: ErdProject,
  tableId: string,
  columnId: string,
): ErdProject {
  const table = findTable(project, tableId)

  if (table === undefined || !table.columns.some((column) => column.id === columnId)) {
    return project
  }

  return parseProject({
    ...replaceTable(project, {
      ...table,
      columns: table.columns.filter((column) => column.id !== columnId),
    }),
    keys: project.keys
      .map((key) =>
        key.tableId === tableId
          ? {
              ...key,
              columnIds: key.columnIds.filter((keyColumnId) => keyColumnId !== columnId),
            }
          : key,
      )
      .filter((key) => key.columnIds.length > 0)
      .map((key) => erdKeySchema.parse(key)),
    relations: project.relations.filter(
      (relation) =>
        !relation.columnMappings.some(
          (mapping) =>
            (relation.sourceTableId === tableId && mapping.sourceColumnId === columnId) ||
            (relation.targetTableId === tableId && mapping.targetColumnId === columnId),
        ),
    ),
  })
}

export function upsertErdKeyInProject(
  project: ErdProject,
  input: CreateErdKeyInput,
): ErdKeyResult | null {
  const key = createErdKey(input)

  if (!hasKeyReferences(project, key)) {
    return null
  }

  const replacedKeys = project.keys.filter((currentKey) => currentKey.id !== key.id)
  const keys =
    key.type === 'primary'
      ? replacedKeys.filter(
          (currentKey) =>
            currentKey.tableId !== key.tableId || currentKey.type !== 'primary',
        )
      : replacedKeys

  return {
    key,
    project: parseProject({
      ...project,
      keys: [...keys, key],
    }),
  }
}

export function updateErdKeyInProject(
  project: ErdProject,
  keyId: string,
  update: ErdKeyUpdate,
): ErdKeyResult | null {
  const key = project.keys.find((currentKey) => currentKey.id === keyId)

  if (key === undefined) {
    return null
  }

  const updatedKey = erdKeySchema.parse({
    ...key,
    ...update,
  })

  return upsertErdKeyInProject(project, {
    columnIds: updatedKey.columnIds,
    id: updatedKey.id,
    tableId: updatedKey.tableId,
    type: updatedKey.type,
    ...(updatedKey.name === undefined ? {} : { name: updatedKey.name }),
  })
}

export function removeErdKeyFromProject(project: ErdProject, keyId: string): ErdProject {
  if (!project.keys.some((key) => key.id === keyId)) {
    return project
  }

  return parseProject({
    ...project,
    keys: project.keys.filter((key) => key.id !== keyId),
  })
}

export function addErdRelationToProject(
  project: ErdProject,
  input: CreateErdRelationInput,
): ErdRelationResult | null {
  const relation = createErdRelation(input)

  if (!hasRelationReferences(project, relation)) {
    return null
  }

  return {
    project: parseProject({
      ...project,
      relations: [...project.relations, relation],
    }),
    relation,
  }
}

export function updateErdRelationInProject(
  project: ErdProject,
  relationId: string,
  update: ErdRelationUpdate,
): ErdRelationResult | null {
  const relation = project.relations.find(
    (currentRelation) => currentRelation.id === relationId,
  )

  if (relation === undefined) {
    return null
  }

  const updatedRelation = erdRelationSchema.parse({
    ...relation,
    ...update,
  })

  if (!hasRelationReferences(project, updatedRelation)) {
    return null
  }

  return {
    project: parseProject({
      ...project,
      relations: project.relations.map((currentRelation) =>
        currentRelation.id === relationId ? updatedRelation : currentRelation,
      ),
    }),
    relation: updatedRelation,
  }
}

export function removeErdRelationFromProject(
  project: ErdProject,
  relationId: string,
): ErdProject {
  if (!project.relations.some((relation) => relation.id === relationId)) {
    return project
  }

  return parseProject({
    ...project,
    relations: project.relations.filter((relation) => relation.id !== relationId),
  })
}

function parseProject(project: ErdProject): ErdProject {
  return erdProjectSchema.parse(project)
}

function replaceTable(project: ErdProject, table: ErdTable): ErdProject {
  return parseProject({
    ...project,
    tables: project.tables.map((currentTable) =>
      currentTable.id === table.id ? erdTableSchema.parse(table) : currentTable,
    ),
  })
}

function findTable(project: ErdProject, tableId: string) {
  return project.tables.find((table) => table.id === tableId)
}

function hasKeyReferences(project: ErdProject, key: ErdKey) {
  const table = findTable(project, key.tableId)

  if (table === undefined) {
    return false
  }

  const columnIds = new Set(table.columns.map((column) => column.id))

  return key.columnIds.every((columnId) => columnIds.has(columnId))
}

function hasRelationReferences(project: ErdProject, relation: ErdRelation) {
  const sourceTable = findTable(project, relation.sourceTableId)
  const targetTable = findTable(project, relation.targetTableId)

  if (sourceTable === undefined || targetTable === undefined) {
    return false
  }

  const sourceColumnIds = new Set(sourceTable.columns.map((column) => column.id))
  const targetColumnIds = new Set(targetTable.columns.map((column) => column.id))

  return relation.columnMappings.every(
    (mapping) =>
      sourceColumnIds.has(mapping.sourceColumnId) &&
      targetColumnIds.has(mapping.targetColumnId),
  )
}

function createNextTablePosition(tableIndex: number): CanvasPosition {
  return {
    x: 80 + (tableIndex % 3) * 320,
    y: 80 + Math.floor(tableIndex / 3) * 220,
  }
}

function createNextColumnOrdinal(columns: ErdColumn[]) {
  return (
    columns.reduce((maxOrdinal, column) => Math.max(maxOrdinal, column.ordinal), -1) + 1
  )
}

function sortColumnsByOrdinal(columns: ErdColumn[]) {
  return [...columns].sort((left, right) => left.ordinal - right.ordinal)
}
