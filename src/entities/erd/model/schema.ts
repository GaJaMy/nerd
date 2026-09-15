import { z } from 'zod'

const MYSQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

const mysqlIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(MYSQL_IDENTIFIER_PATTERN)

const canvasPositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

const canvasSizeSchema = z.object({
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

export const MYSQL_DATA_TYPES = [
  'INT',
  'BIGINT',
  'VARCHAR',
  'TEXT',
  'DECIMAL',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
] as const

export const mysqlDataTypeSchema = z
  .object({
    length: z.number().int().positive().optional(),
    name: z.enum(MYSQL_DATA_TYPES),
    precision: z.number().int().positive().optional(),
    scale: z.number().int().nonnegative().optional(),
    unsigned: z.boolean().optional(),
  })
  .superRefine((type, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })
    if (type.name === 'VARCHAR') {
      if (!type.length || type.length > 16383)
        invalid('VARCHAR 길이는 1~16383이어야 합니다.')
    } else if (type.length !== undefined)
      invalid('길이는 VARCHAR에만 지정할 수 있습니다.')
    if (type.name === 'DECIMAL') {
      if (
        type.precision === undefined ||
        type.precision > 65 ||
        type.scale === undefined ||
        type.scale > 30 ||
        type.scale > type.precision
      )
        invalid('DECIMAL 정밀도는 1~65, 소수 자릿수는 0~30이며 정밀도 이하여야 합니다.')
    } else if (type.precision !== undefined || type.scale !== undefined)
      invalid('정밀도와 소수 자릿수는 DECIMAL에만 지정할 수 있습니다.')
    if (type.unsigned && type.name !== 'INT' && type.name !== 'BIGINT')
      invalid('UNSIGNED는 INT와 BIGINT에만 지원합니다.')
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

const erdKeyTypeSchema = z.enum(['primary', 'foreign', 'unique'])

export const erdKeySchema = z.object({
  columnIds: z.array(z.string().min(1)).min(1),
  id: z.string().min(1),
  name: mysqlIdentifierSchema.optional(),
  tableId: z.string().min(1),
  type: erdKeyTypeSchema,
})

export const relationCardinalitySchema = z.enum(['one-to-one', 'one-to-many'])

const relationColumnMappingSchema = z.object({
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
  keys: z.array(erdKeySchema),
  name: z.string().trim().min(1),
  relations: z.array(erdRelationSchema),
  tables: z.array(erdTableSchema),
  updatedAt: z.string().datetime().optional(),
  viewport: canvasViewportSchema,
})

export type CanvasPosition = z.infer<typeof canvasPositionSchema>
export type CanvasViewport = z.infer<typeof canvasViewportSchema>
export type DisplayOptions = z.infer<typeof displayOptionsSchema>
export type ErdColumn = z.infer<typeof erdColumnSchema>
export type ErdKey = z.infer<typeof erdKeySchema>
export type ErdKeyType = z.infer<typeof erdKeyTypeSchema>
export type ErdProject = z.infer<typeof erdProjectSchema>
export type ErdRelation = z.infer<typeof erdRelationSchema>
export type ErdTable = z.infer<typeof erdTableSchema>
export type MysqlDataType = z.infer<typeof mysqlDataTypeSchema>
export type RelationCardinality = z.infer<typeof relationCardinalitySchema>
export type RelationColumnMapping = z.infer<typeof relationColumnMappingSchema>
