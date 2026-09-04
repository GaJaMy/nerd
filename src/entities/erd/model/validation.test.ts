import {
  createErdColumn,
  createErdKey,
  createErdProject,
  createErdTable,
  validateErdProject,
} from './index'

describe('validateErdProject', () => {
  it('reports duplicate table and column physical names', () => {
    const idColumn = createErdColumn({
      dataType: { name: 'BIGINT' },
      id: 'column_id',
      nullable: false,
      physicalName: 'id',
    })
    const duplicatedIdColumn = createErdColumn({
      dataType: { name: 'BIGINT' },
      id: 'column_id_copy',
      nullable: false,
      ordinal: 1,
      physicalName: 'ID',
    })
    const firstTable = createErdTable({
      columns: [idColumn, duplicatedIdColumn],
      id: 'table_users',
      physicalName: 'users',
    })
    const duplicatedTable = createErdTable({
      id: 'table_users_copy',
      physicalName: 'USERS',
    })
    const project = createErdProject({
      id: 'project_with_duplicates',
      tables: [firstTable, duplicatedTable],
    })

    expect(validateErdProject(project)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate-table-physical-name' }),
        expect.objectContaining({ code: 'duplicate-column-physical-name' }),
      ]),
    )
  })

  it('reports invalid key table, key columns, and primary key count', () => {
    const idColumn = createErdColumn({
      dataType: { name: 'BIGINT' },
      id: 'column_id',
      nullable: false,
      physicalName: 'id',
    })
    const nameColumn = createErdColumn({
      dataType: { length: 255, name: 'VARCHAR' },
      id: 'column_name',
      nullable: false,
      physicalName: 'name',
    })
    const usersTable = createErdTable({
      columns: [idColumn, nameColumn],
      id: 'table_users',
      physicalName: 'users',
    })
    const project = createErdProject({
      id: 'project_with_invalid_keys',
      keys: [
        createErdKey({
          columnIds: ['column_id'],
          id: 'key_users_primary',
          tableId: 'table_users',
          type: 'primary',
        }),
        createErdKey({
          columnIds: ['column_name'],
          id: 'key_users_primary_copy',
          tableId: 'table_users',
          type: 'primary',
        }),
        createErdKey({
          columnIds: ['column_id', 'column_id'],
          id: 'key_users_duplicate_column',
          tableId: 'table_users',
          type: 'unique',
        }),
        createErdKey({
          columnIds: ['column_missing'],
          id: 'key_users_missing_column',
          tableId: 'table_users',
          type: 'unique',
        }),
        createErdKey({
          columnIds: ['column_id'],
          id: 'key_missing_table',
          tableId: 'table_missing',
          type: 'unique',
        }),
      ],
      tables: [usersTable],
    })

    expect(validateErdProject(project)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate-primary-key' }),
        expect.objectContaining({ code: 'duplicate-key-column' }),
        expect.objectContaining({ code: 'missing-key-column' }),
        expect.objectContaining({ code: 'missing-key-table' }),
      ]),
    )
  })

  it('validates relation column mappings against the target key order', () => {
    const userTenantIdColumn = createErdColumn({
      dataType: { name: 'BIGINT' },
      id: 'column_users_tenant_id',
      nullable: false,
      physicalName: 'tenant_id',
    })
    const userIdColumn = createErdColumn({
      dataType: { name: 'BIGINT' },
      id: 'column_users_id',
      nullable: false,
      ordinal: 1,
      physicalName: 'id',
    })
    const orderTenantIdColumn = createErdColumn({
      dataType: { name: 'BIGINT' },
      id: 'column_orders_tenant_id',
      nullable: false,
      physicalName: 'tenant_id',
    })
    const orderUserIdColumn = createErdColumn({
      dataType: { name: 'BIGINT' },
      id: 'column_orders_user_id',
      nullable: false,
      ordinal: 1,
      physicalName: 'user_id',
    })
    const usersTable = createErdTable({
      columns: [userTenantIdColumn, userIdColumn],
      id: 'table_users',
      physicalName: 'users',
    })
    const ordersTable = createErdTable({
      columns: [orderTenantIdColumn, orderUserIdColumn],
      id: 'table_orders',
      physicalName: 'orders',
    })
    const usersPrimaryKey = createErdKey({
      columnIds: ['column_users_tenant_id', 'column_users_id'],
      id: 'key_users_primary',
      tableId: 'table_users',
      type: 'primary',
    })
    const validProject = createErdProject({
      id: 'project_with_composite_relation',
      keys: [usersPrimaryKey],
      relations: [
        {
          cardinality: 'one-to-many',
          columnMappings: [
            {
              ordinal: 1,
              sourceColumnId: 'column_orders_user_id',
              targetColumnId: 'column_users_id',
            },
            {
              ordinal: 0,
              sourceColumnId: 'column_orders_tenant_id',
              targetColumnId: 'column_users_tenant_id',
            },
          ],
          hidden: false,
          id: 'relation_orders_users',
          sourceTableId: 'table_orders',
          targetTableId: 'table_users',
        },
      ],
      tables: [usersTable, ordersTable],
    })

    expect(validateErdProject(validProject)).toEqual([])

    const validRelation = validProject.relations[0]

    if (validRelation === undefined) {
      throw new Error('Expected relation fixture to exist')
    }

    const invalidProject = createErdProject({
      ...validProject,
      relations: [
        {
          ...validRelation,
          columnMappings: [
            {
              ordinal: 0,
              sourceColumnId: 'column_orders_user_id',
              targetColumnId: 'column_users_id',
            },
          ],
        },
      ],
    })

    expect(validateErdProject(invalidProject)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'relation-target-key-mismatch' }),
      ]),
    )
  })
})
