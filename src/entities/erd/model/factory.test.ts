import {
  createDefaultDisplayOptions,
  createErdColumn,
  createErdProject,
  createErdTable,
  createUniqueTablePhysicalName,
  erdTableSchema,
  validateErdProject,
} from './index'

describe('ERD model factory', () => {
  it('creates an empty volatile ERD project with default display options', () => {
    const project = createErdProject({ id: 'project_test' })

    expect(project).toMatchObject({
      displayOptions: createDefaultDisplayOptions(),
      id: 'project_test',
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

  it('validates table and column physical name duplication', () => {
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
