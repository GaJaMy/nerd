import { expect, test } from '@playwright/test'

test('adds a table to the ERD canvas', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'ERD 편집기' })).toBeVisible()
  await expect(page.getByTestId('erd-canvas')).toBeVisible()

  await page.getByRole('button', { name: '테이블 추가' }).click()

  await expect(page.getByTestId('erd-table-node-table_1')).toBeVisible()
  await expect(page.getByText('테이블 1개')).toBeVisible()
  await expect(
    page.getByTestId('erd-table-node-table_1').getByText('table_1'),
  ).toBeVisible()
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
  await page.getByRole('button', { name: 'table_1 숨기기' }).click()
  await expect(node).toHaveCount(0)
  await page.getByLabel('테이블 검색').fill('TABLE_1')
  await page.getByRole('button', { name: 'table_1 (숨김)', exact: true }).click()
  await expect(node).toBeInViewport()
  await page.reload()
  await expect(page.getByText('테이블 0개')).toBeVisible()
})
