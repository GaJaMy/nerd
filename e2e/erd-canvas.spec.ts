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
