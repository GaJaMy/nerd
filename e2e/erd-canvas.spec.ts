import { expect, test, type Page } from '@playwright/test'

import { readFile } from 'node:fs/promises'

async function drawTable(page: Page, offset = 0) {
  const canvas = await page.getByTestId('erd-canvas').boundingBox()
  if (!canvas) throw new Error('Canvas missing')
  const x = canvas.x + (canvas.width < 500 ? 12 : 40) + offset
  const y = canvas.y + 70
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(Math.min(x + 360, canvas.x + canvas.width - 12), y + 160, {
    steps: 8,
  })
  await page.mouse.up()
}

test('cancels drawing and keeps pan gestures separate from table creation', async ({
  page,
}) => {
  await page.goto('/')
  const canvas = (await page.getByTestId('erd-canvas').boundingBox())!
  await page.mouse.click(canvas.x + 50, canvas.y + 70)
  await expect(page.getByText('테이블 0개')).toBeVisible()
  await page.mouse.move(canvas.x + 50, canvas.y + 70)
  await page.mouse.down()
  await page.mouse.move(canvas.x + 350, canvas.y + 250)
  await expect(page.getByTestId('table-drawing-preview')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(page.getByText('테이블 0개')).toBeVisible()
  await page.getByRole('button', { name: '화면 이동', exact: true }).click()
  const before = await page.locator('.react-flow__viewport').getAttribute('style')
  await drawTable(page)
  await expect(page.locator('.react-flow__viewport')).not.toHaveAttribute(
    'style',
    before!,
  )
  await expect(page.getByText('테이블 0개')).toBeVisible()
  await page.getByRole('button', { name: '테이블 그리기', exact: true }).click()
  await page.getByRole('button', { name: 'Zoom Out', exact: true }).click()
  await drawTable(page)
  await expect(page.getByTestId('erd-table-node-table_1')).toBeInViewport()
})

test('adds a table to the ERD canvas', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'ERD 편집기' })).toBeVisible()
  await expect(page.getByTestId('erd-canvas')).toBeVisible()

  await drawTable(page)

  await expect(page.getByTestId('erd-table-node-table_1')).toBeVisible()
  await expect(page.getByText('테이블 1개')).toBeVisible()
  await expect(
    page.getByTestId('erd-table-node-table_1').getByLabel('캔버스 테이블 물리명'),
  ).toBeVisible()
})

test('resizes the drawing preview in both directions before applying the minimum table size', async ({
  page,
}) => {
  await page.goto('/')
  const canvas = (await page.getByTestId('erd-canvas').boundingBox())!
  const start = { x: canvas.x + 180, y: canvas.y + 180 }
  const preview = page.getByTestId('table-drawing-preview')
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await expect(preview).toHaveCount(0)
  await page.mouse.move(start.x + 30, start.y + 20)
  await expect(preview).toHaveCSS('width', '30px')
  await expect(preview).toHaveCSS('height', '20px')
  await page.mouse.move(start.x + 100, start.y + 80)
  await expect(preview).toHaveCSS('width', '100px')
  await expect(preview).toHaveCSS('height', '80px')
  await page.mouse.move(start.x - 70, start.y - 50)
  await expect(preview).toHaveCSS('width', '70px')
  const box = (await preview.boundingBox())!
  expect(box.x).toBeCloseTo(start.x - 70, 0)
  expect(box.y).toBeCloseTo(start.y - 50, 0)
  await page.mouse.up()
  await expect(preview).toHaveCount(0)
  await expect(page.getByTestId('erd-table-node-table_1')).toHaveCSS('width', '360px')
})

test('designs a composite relation and downloads MySQL DDL', async ({ page }) => {
  await page.goto('/')
  for (const name of ['parents', 'children']) {
    await drawTable(page, name === 'children' ? 440 : 0)
    await page.getByLabel('테이블 물리명', { exact: true }).fill(name)
    await page
      .getByTestId('erd-table-node-' + name)
      .getByTestId('column-add-area')
      .hover()
    await page
      .getByTestId('erd-table-node-' + name)
      .getByRole('button', { name: '컬럼 추가' })
      .click()
    await page
      .getByTestId('erd-table-node-' + name)
      .getByTestId('column-add-area')
      .hover()
    await page
      .getByTestId('erd-table-node-' + name)
      .getByRole('button', { name: '컬럼 추가' })
      .click()
    if (name === 'parents') {
      const pk = page.getByRole('region', { name: '기본키 설정' })
      await pk.getByLabel('column_1').check()
      await pk.getByLabel('column_2').check()
      await pk.getByRole('button', { name: '기본키 적용' }).click()
    }
  }
  const relation = page.getByRole('region', { name: '관계 설정' })
  await page.getByRole('button', { name: '일대일 관계 연결', exact: true }).click()
  await page.getByRole('button', { name: '관계 테이블 children 선택' }).click()
  await expect(page.getByTestId('erd-canvas').getByRole('status')).toContainText(
    '참조 대상',
  )
  await page.getByRole('button', { name: '관계 테이블 parents 선택' }).click()
  await relation.getByLabel('FK 1 → column_1').selectOption({ label: 'column_1' })
  await relation.getByLabel('FK 2 → column_2').selectOption({ label: 'column_2' })
  await expect(relation.getByLabel('관계 종류')).toHaveValue('one-to-one')
  await relation.getByRole('button', { name: '관계 추가' }).click()
  await expect(page.locator('.react-flow__edge')).toHaveCount(1)
  await expect(page.locator('.react-flow__edge-text')).toContainText('1:1')
  await page.getByRole('button', { name: 'DDL 패널 열기' }).click()
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
  await page.getByRole('button', { name: '일대다 관계 연결' }).click()
  await page.getByRole('button', { name: '관계 테이블 parents 선택' }).click()
  await page.getByRole('button', { name: '관계 테이블 parents 선택' }).click()
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
  await drawTable(page)
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
  await page.getByRole('button', { name: '테이블 검색 열기' }).click()
  await page.getByRole('button', { name: 'table_1 숨기기' }).click()
  await expect(node).toHaveCount(0)
  await page.getByLabel('테이블 검색', { exact: true }).fill('TABLE_1')
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
  await drawTable(page)
  await expect(page.getByTestId('erd-table-node-table_1')).toBeInViewport()
  await page.getByLabel('테이블 물리명', { exact: true }).fill('mobile_table')
  await expect(page.getByTestId('erd-table-node-mobile_table')).toBeInViewport()
  const add = page
    .getByTestId('erd-table-node-mobile_table')
    .getByRole('button', { name: '컬럼 추가' })
  await add.focus()
  await expect(add).toHaveCSS('opacity', '1')
  await page.keyboard.press('Enter')
  await expect(
    page.getByTestId('erd-table-node-mobile_table').getByLabel('캔버스 컬럼 물리명'),
  ).toHaveValue('column_1')
  await page.screenshot({ path: 'test-results/erd-mobile.png', fullPage: true })
})

test('cancels relation picking on Escape and when the selected table is hidden', async ({
  page,
}) => {
  await page.goto('/')
  await drawTable(page)
  const node = page.getByTestId('erd-table-node-table_1')
  const add = node.getByRole('button', { name: '컬럼 추가' })
  await node.getByTestId('column-add-area').hover()
  await add.click()
  const relation = page.getByRole('region', { name: '관계 설정' })
  const connect = page.getByRole('button', { name: '일대다 관계 연결', exact: true })
  await connect.click()
  const status = page.getByTestId('erd-canvas').getByRole('status')
  await expect(status).toContainText('FK 소유 테이블')
  await expect(node.getByLabel('캔버스 테이블 논리명')).toBeDisabled()
  await expect(node.getByLabel('캔버스 테이블 물리명')).toBeDisabled()
  await expect(node.getByLabel('캔버스 컬럼 논리명')).toBeDisabled()
  await expect(node.getByLabel('캔버스 컬럼 물리명')).toBeDisabled()
  await expect(add).toBeDisabled()
  await page.getByRole('button', { name: '관계 테이블 table_1 선택' }).click()
  await expect(status).toContainText('FK: table_1')
  await expect(status).toContainText('참조 대상 테이블')
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)

  await page.keyboard.press('Escape')
  await expect(status).not.toContainText('참조 대상')
  await expect(relation.getByRole('button', { name: '연결 취소' })).toHaveCount(0)
  await expect(node.getByLabel('캔버스 테이블 물리명')).toBeEnabled()
  await expect(node.getByLabel('캔버스 컬럼 물리명')).toBeEnabled()
  await expect(add).toBeEnabled()
  await expect(
    page.getByRole('button', { name: '테이블 그리기', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')

  await connect.click()
  await expect(status).toContainText('FK 소유 테이블')
  await page.getByRole('button', { name: '관계 테이블 table_1 선택' }).click()
  await expect(status).toContainText('참조 대상 테이블')
  await page.getByRole('button', { name: '테이블 검색 열기' }).click()
  await page.getByRole('button', { name: 'table_1 숨기기', exact: true }).click()
  await expect(node).toHaveCount(0)
  await expect(relation.getByRole('status')).toHaveCount(0)
  await expect(relation.getByRole('button', { name: '연결 취소' })).toHaveCount(0)
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)
})

test.describe('touch column creation', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

  test('shows the bottom add button without hover and adds a column on tap', async ({
    page,
  }) => {
    await page.goto('/')
    await drawTable(page)
    await page.mouse.move(0, 0)
    const node = page.getByTestId('erd-table-node-table_1')
    const add = node.getByRole('button', { name: '컬럼 추가' })
    await expect(add).not.toBeFocused()
    await expect(add).toHaveCSS('opacity', '1')
    await add.tap()
    await expect(node.getByLabel('캔버스 컬럼 물리명')).toHaveValue('column_1')
    await expect(
      page
        .getByRole('region', { name: '컬럼 편집' })
        .getByLabel('컬럼 물리명', { exact: true }),
    ).toHaveValue('column_1')
  })
})
