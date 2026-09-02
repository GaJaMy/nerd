import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach } from 'vitest'
import { useDensityPreference } from '../model/use-density-preference'
import { DensityToggle } from './DensityToggle'
import { renderWithClient } from '@/shared/testing/render'

describe('DensityToggle', () => {
  beforeEach(() => {
    useDensityPreference.setState({ density: 'comfortable' })
  })

  it('toggles between comfortable and compact density labels', async () => {
    const user = userEvent.setup()

    renderWithClient(<DensityToggle />)

    await user.click(screen.getByRole('button', { name: /use compact density/i }))

    expect(
      screen.getByRole('button', { name: /use comfortable density/i }),
    ).toBeInTheDocument()
  })
})
