import { mysqlDataTypeSchema } from './schema'

describe('MySQL type options', () => {
  it('validates supported types and option bounds', () => {
    expect(mysqlDataTypeSchema.safeParse({ name: 'VARCHAR', length: 255 }).success).toBe(
      true,
    )
    expect(
      mysqlDataTypeSchema.safeParse({ name: 'DECIMAL', precision: 65, scale: 30 })
        .success,
    ).toBe(true)
    for (const value of [
      { name: 'JSON' },
      { name: 'VARCHAR' },
      { name: 'INT', length: 10 },
      { name: 'DECIMAL', precision: 3, scale: 4 },
      { name: 'TEXT', unsigned: true },
    ]) {
      expect(mysqlDataTypeSchema.safeParse(value).success).toBe(false)
    }
  })
})
