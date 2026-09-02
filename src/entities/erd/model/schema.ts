import { z } from 'zod'

export const MYSQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export const mysqlIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(MYSQL_IDENTIFIER_PATTERN)

export const canvasPositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

export const canvasSizeSchema = z.object({
  height: z.number().positive().finite(),
  width: z.number().positive().finite(),
})

export const canvasViewportSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  zoom: z.number().positive().finite(),
})

export const displayOptionsSchema = z.object({
  showComment: z.boolean(),
  showDataType: z.boolean(),
  showHiddenTables: z.boolean().optional(),
  showLogicalName: z.boolean(),
  showPhysicalName: z.boolean(),
})

export const mysqlDataTypeSchema = z.object({
  length: z.number().int().positive().optional(),
  name: z.string().trim().min(1),
  precision: z.number().int().positive().optional(),
  scale: z.number().int().nonnegative().optional(),
  unsigned: z.boolean().optional(),
})

export const erdColumnSchema = z.object({
  comment: z.string().optional(),
  dataType: mysqlDataTypeSchema,
  defaultValue: z.string().optional(),
  id: z.string().min(1),
  logicalName: z.string().trim().min(1).optional(),
  nullable: z.boolean(),
  ordinal: z.number().int().nonnegative(),
  physicalName: mysqlIdentifierSchema,
})

export const relationCardinalitySchema = z.enum(['one-to-one', 'one-to-many'])

export const relationColumnMappingSchema = z.object({
  ordinal: z.number().int().nonnegative(),
  sourceColumnId: z.string().min(1),
  targetColumnId: z.string().min(1),
})

export const erdRelationSchema = z.object({
  cardinality: relationCardinalitySchema,
  columnMappings: z.array(relationColumnMappingSchema).min(1),
  hidden: z.boolean(),
  id: z.string().min(1),
  label: z.string().trim().min(1).optional(),
  sourceTableId: z.string().min(1),
  targetTableId: z.string().min(1),
})

export const erdTableSchema = z.object({
  columns: z.array(erdColumnSchema),
  comment: z.string().optional(),
  hidden: z.boolean(),
  id: z.string().min(1),
  logicalName: z.string().trim().min(1).optional(),
  physicalName: mysqlIdentifierSchema,
  position: canvasPositionSchema,
  size: canvasSizeSchema.optional(),
})

export const erdProjectSchema = z.object({
  createdAt: z.string().datetime().optional(),
  displayOptions: displayOptionsSchema,
  id: z.string().min(1),
  name: z.string().trim().min(1),
  relations: z.array(erdRelationSchema),
  tables: z.array(erdTableSchema),
  updatedAt: z.string().datetime().optional(),
  viewport: canvasViewportSchema,
})

export type CanvasPosition = z.infer<typeof canvasPositionSchema>
export type CanvasSize = z.infer<typeof canvasSizeSchema>
export type CanvasViewport = z.infer<typeof canvasViewportSchema>
export type DisplayOptions = z.infer<typeof displayOptionsSchema>
export type ErdColumn = z.infer<typeof erdColumnSchema>
export type ErdProject = z.infer<typeof erdProjectSchema>
export type ErdRelation = z.infer<typeof erdRelationSchema>
export type ErdTable = z.infer<typeof erdTableSchema>
export type MysqlDataType = z.infer<typeof mysqlDataTypeSchema>
export type RelationCardinality = z.infer<typeof relationCardinalitySchema>
export type RelationColumnMapping = z.infer<typeof relationColumnMappingSchema>
