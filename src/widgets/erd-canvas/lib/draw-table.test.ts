import { getDrawnTable } from './draw-table'

it('converts reverse drawing through pan and zoom and rejects accidental clicks', () => {
  expect(
    getDrawnTable({ x: 500, y: 400 }, { x: 100, y: 100 }, { x: -100, y: 50, zoom: 0.5 }),
  ).toEqual({ position: { x: 400, y: 100 }, size: { width: 800, height: 600 } })
  expect(
    getDrawnTable({ x: 0, y: 0 }, { x: 20, y: 20 }, { x: 0, y: 0, zoom: 2 })?.size,
  ).toEqual({ width: 360, height: 140 })
  expect(
    getDrawnTable({ x: 0, y: 0 }, { x: 2, y: 3 }, { x: 0, y: 0, zoom: 1 }),
  ).toBeNull()
})
