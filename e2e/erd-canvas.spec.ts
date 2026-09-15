import { expect, test } from '@playwright/test'

import { readFile } from 'node:fs/promises'

test('adds a table to the ERD canvas', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'ERD 편집기' })).toBeVisible()
  await expect(page.getByTestId('erd-canvas')).toBeVisible()

  await page.getByRole('button', { name: '테이블 추가' }).click()

  await expect(page.getByTestId('erd-table-node-table_1')).toBeVisible()
  await expect(page.getByText('테이블 1개')).toBeVisible()
  await expect(
    page.getByTestId('erd-table-node-table_1').getByLabel('캔버스 테이블 물리명'),
  ).toBeVisible()
})

test('designs a composite relation and downloads MySQL DDL', async ({ page }) => {
  await page.goto('/')
  for (const name of ['parents', 'children']) {
    await page.getByRole('button', { name: '테이블 추가' }).click()
    await page.getByLabel('테이블 물리명', { exact: true }).fill(name)
    await page.getByRole('button', { name: '컬럼 추가' }).click()
    await page.getByRole('button', { name: '컬럼 추가' }).click()
    if (name === 'parents') {
      const pk = page.getByRole('region', { name: '기본키 설정' })
      await pk.getByLabel('column_1').check()
      await pk.getByLabel('column_2').check()
      await pk.getByRole('button', { name: '기본키 적용' }).click()
    }
  }
  const relation = page.getByRole('region', { name: '관계 설정' })
  await relation.getByLabel('FK 소유 테이블').selectOption({ label: 'children' })
  await relation.getByLabel('참조 대상 테이블').selectOption({ label: 'parents' })
  await relation.getByLabel('FK 1 → column_1').selectOption({ label: 'column_1' })
  await relation.getByLabel('FK 2 → column_2').selectOption({ label: 'column_2' })
  await relation.getByLabel('관계 종류').selectOption('one-to-one')
  await relation.getByRole('button', { name: '관계 추가' }).click()
  await expect(page.locator('.react-flow__edge')).toHaveCount(1)
  await expect(page.locator('.react-flow__edge-text')).toContainText('1:1')
  await page.getByRole('button', { name: 'MySQL DDL 내보내기' }).click()
  const ddl = await page.getByLabel('MySQL DDL', { exact: true }).inputValue()
  expect(ddl).toContain('PRIMARY KEY (`column_1`, `column_2`)')
  expect(ddl).toContain('UNIQUE KEY (`column_1`, `column_2`)')
  expect(ddl).toContain('REFERENCES `parents` (`column_1`, `column_2`)')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'SQL 다운로드' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('erd.sql')
  expect(await readFile(await download.path(), 'utf8')).toBe(ddl)
  await page.screenshot({ path: 'test-results/erd-complete.png', fullPage: true })
  await relation.getByRole('button', { name: '새 관계' }).click()
  await relation.getByLabel('FK 소유 테이블').selectOption({ label: 'parents' })
  await relation.getByLabel('참조 대상 테이블').selectOption({ label: 'parents' })
  await relation.getByLabel('FK 1 → column_1').selectOption({ label: 'column_1' })
  await relation.getByLabel('FK 2 → column_2').selectOption({ label: 'column_2' })
  await relation.getByRole('button', { name: '관계 추가' }).click()
  await expect(
    page.locator('.react-flow__edge-selfRelation path.react-flow__edge-path'),
  ).toHaveAttribute('d', /C/)
})

test('moves, hides, and focuses a table and resets volatile data on reload', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '테이블 추가' }).click()
  const node = page.getByTestId('erd-table-node-table_1')
  const before = await node.boundingBox()
  if (!before) throw new Error('Table node is missing')
  await page.mouse.move(before.x + 100, before.y + 20)
  await page.mouse.down()
  await page.mouse.move(before.x + 280, before.y + 140, { steps: 12 })
  await page.mouse.up()
  const after = await node.boundingBox()
  expect(after!.x).toBeGreaterThan(before.x + 100)
  const viewportBeforeSearch = await page
    .locator('.react-flow__viewport')
    .getAttribute('style')
  await page.getByRole('button', { name: 'Zoom Out', exact: true }).click()
  await expect(page.locator('.react-flow__viewport')).not.toHaveAttribute(
    'style',
    viewportBeforeSearch!,
  )
  await page.getByRole('button', { name: 'table_1 숨기기' }).click()
  await expect(node).toHaveCount(0)
  await page.getByLabel('테이블 검색').fill('TABLE_1')
  await page.getByRole('button', { name: 'table_1 (숨김)', exact: true }).click()
  await expect(node).toBeInViewport()
  await expect(page.locator('.react-flow__viewport')).not.toHaveAttribute(
    'style',
    viewportBeforeSearch!,
  )
  await page.reload()
  await expect(page.getByText('테이블 0개')).toBeVisible()
})

test('keeps the canvas and editor usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: '테이블 추가' }).click()
  await expect(page.getByTestId('erd-table-node-table_1')).toBeInViewport()
  await page.getByLabel('테이블 물리명', { exact: true }).fill('mobile_table')
  await expect(page.getByTestId('erd-table-node-mobile_table')).toBeInViewport()
  await page.screenshot({ path: 'test-results/erd-mobile.png', fullPage: true })
})
