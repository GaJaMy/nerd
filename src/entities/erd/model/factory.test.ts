import {
  createDefaultDisplayOptions,
  createErdKey,
  createErdProject,
  createErdRelation,
  createErdTable,
  createUniqueTablePhysicalName,
  erdTableSchema,
} from './index'

describe('ERD model factory', () => {
  it('creates an empty volatile ERD project with default display options', () => {
    const project = createErdProject({ id: 'project_test' })

    expect(project).toMatchObject({
      displayOptions: createDefaultDisplayOptions(),
      id: 'project_test',
      keys: [],
      name: '새 ERD 프로젝트',
      relations: [],
      tables: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    })
  })

  it('creates valid tables and suggests the next unique physical name', () => {
    const table = createErdTable({
      id: 'table_test',
      physicalName: 'users',
      position: { x: 120, y: 80 },
    })

    expect(table).toMatchObject({
      columns: [],
      hidden: false,
      id: 'table_test',
      physicalName: 'users',
      position: { x: 120, y: 80 },
    })

    expect(createUniqueTablePhysicalName([table])).toBe('table_1')
  })

  it('creates valid single-column and composite keys', () => {
    expect(
      createErdKey({
        columnIds: ['column_id'],
        id: 'key_users_primary',
        name: 'pk_users',
        tableId: 'table_users',
        type: 'primary',
      }),
    ).toMatchObject({
      columnIds: ['column_id'],
      id: 'key_users_primary',
      name: 'pk_users',
      tableId: 'table_users',
      type: 'primary',
    })

    expect(
      createErdKey({
        columnIds: ['column_tenant_id', 'column_id'],
        id: 'key_users_unique_tenant_id',
        tableId: 'table_users',
        type: 'unique',
      }),
    ).toMatchObject({
      columnIds: ['column_tenant_id', 'column_id'],
      id: 'key_users_unique_tenant_id',
      tableId: 'table_users',
      type: 'unique',
    })
  })

  it('creates valid relations with column mappings', () => {
    expect(
      createErdRelation({
        cardinality: 'one-to-many',
        columnMappings: [
          {
            ordinal: 0,
            sourceColumnId: 'column_orders_user_id',
            targetColumnId: 'column_users_id',
          },
        ],
        id: 'relation_orders_users',
        sourceTableId: 'table_orders',
        targetTableId: 'table_users',
      }),
    ).toMatchObject({
      cardinality: 'one-to-many',
      hidden: false,
      id: 'relation_orders_users',
      sourceTableId: 'table_orders',
      targetTableId: 'table_users',
    })
  })

  it('rejects table physical names that are not MySQL-safe identifiers', () => {
    expect(
      erdTableSchema.safeParse({
        columns: [],
        hidden: false,
        id: 'table_invalid',
        physicalName: '1-users',
        position: { x: 0, y: 0 },
      }).success,
    ).toBe(false)
  })
})
