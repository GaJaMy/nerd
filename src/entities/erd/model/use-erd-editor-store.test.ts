import { useErdEditorStore } from './index'

describe('useErdEditorStore', () => {
  beforeEach(() => {
    useErdEditorStore.getState().resetProject()
  })

  it('manages volatile project metadata, viewport, display options, and table state', () => {
    const store = useErdEditorStore.getState()

    store.renameProject('주문 관리 ERD')
    store.setViewport({ x: 120, y: -80, zoom: 1.25 })
    store.patchDisplayOptions({ showComment: false })

    const table = store.addTable({
      logicalName: '사용자',
      physicalName: 'users',
      position: { x: 40, y: 60 },
    })

    store.moveTable(table.id, { x: 240, y: 180 })
    store.updateTable(table.id, { comment: '서비스 사용자 테이블' })

    const state = useErdEditorStore.getState()

    const firstTable = state.project.tables[0]

    if (firstTable === undefined) {
      throw new Error('Expected a table to be added')
    }

    expect(state.project.displayOptions.showComment).toBe(false)
    expect(state.project.name).toBe('주문 관리 ERD')
    expect(state.project.viewport).toEqual({ x: 120, y: -80, zoom: 1.25 })
    expect(firstTable).toMatchObject({
      comment: '서비스 사용자 테이블',
      logicalName: '사용자',
      physicalName: 'users',
      position: { x: 240, y: 180 },
    })
    expect(state.selectedTableId).toBe(table.id)
    expect(state.validationIssues).toEqual([])
  })

  it('adds columns, keys, and relations while keeping selection state explicit', () => {
    const store = useErdEditorStore.getState()
    const usersTable = store.addTable({
      id: 'table_users',
      physicalName: 'users',
    })
    const ordersTable = store.addTable({
      id: 'table_orders',
      physicalName: 'orders',
    })

    const userIdColumn = store.addColumn(usersTable.id, {
      dataType: { name: 'BIGINT' },
      id: 'column_users_id',
      nullable: false,
      physicalName: 'id',
    })
    const orderUserIdColumn = store.addColumn(ordersTable.id, {
      dataType: { name: 'BIGINT' },
      id: 'column_orders_user_id',
      nullable: false,
      physicalName: 'user_id',
    })

    if (userIdColumn === null || orderUserIdColumn === null) {
      throw new Error('Expected columns to be added')
    }

    const primaryKey = store.upsertKey({
      columnIds: [userIdColumn.id],
      id: 'key_users_primary',
      tableId: usersTable.id,
      type: 'primary',
    })
    const relation = store.addRelation({
      cardinality: 'one-to-many',
      columnMappings: [
        {
          ordinal: 0,
          sourceColumnId: orderUserIdColumn.id,
          targetColumnId: userIdColumn.id,
        },
      ],
      id: 'relation_orders_users',
      sourceTableId: ordersTable.id,
      targetTableId: usersTable.id,
    })

    const state = useErdEditorStore.getState()

    expect(primaryKey).toMatchObject({ id: 'key_users_primary' })
    expect(relation).toMatchObject({ id: 'relation_orders_users' })
    expect(state.project.keys).toHaveLength(1)
    expect(state.project.relations).toHaveLength(1)
    expect(state.selectedColumnId).toBeNull()
    expect(state.selectedRelationId).toBe('relation_orders_users')
    expect(state.selectedTableId).toBeNull()
    expect(state.validationIssues).toEqual([])
  })

  it('rejects key and relation actions with missing table or column references', () => {
    const store = useErdEditorStore.getState()
    const table = store.addTable({
      id: 'table_users',
      physicalName: 'users',
    })

    expect(
      store.upsertKey({
        columnIds: ['column_missing'],
        id: 'key_invalid',
        tableId: table.id,
        type: 'primary',
      }),
    ).toBeNull()
    expect(
      store.addRelation({
        cardinality: 'one-to-many',
        columnMappings: [
          {
            ordinal: 0,
            sourceColumnId: 'column_missing',
            targetColumnId: 'column_missing',
          },
        ],
        id: 'relation_invalid',
        sourceTableId: table.id,
        targetTableId: 'table_missing',
      }),
    ).toBeNull()
    expect(useErdEditorStore.getState().project.keys).toEqual([])
    expect(useErdEditorStore.getState().project.relations).toEqual([])
  })

  it('refreshes validation issues after project actions', () => {
    const store = useErdEditorStore.getState()
    const usersTable = store.addTable({
      id: 'table_users',
      physicalName: 'users',
    })
    const ordersTable = store.addTable({
      id: 'table_orders',
      physicalName: 'orders',
    })

    store.updateTable(ordersTable.id, { physicalName: 'USERS' })

    expect(
      useErdEditorStore
        .getState()
        .validationIssues.some((issue) => issue.code === 'duplicate-table-physical-name'),
    ).toBe(true)

    store.updateTable(usersTable.id, { physicalName: 'accounts' })

    expect(useErdEditorStore.getState().validationIssues).toEqual([])
  })
})
