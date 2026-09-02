import { screen } from '@testing-library/react'
import { HomePage } from './HomePage'
import { renderWithClient } from '@/shared/testing/render'

describe('HomePage', () => {
  it('shows the frontend architecture baseline', async () => {
    renderWithClient(<HomePage />)

    expect(
      screen.getByRole('heading', {
        name: /typed, testable, feature-sliced react project/i,
      }),
    ).toBeInTheDocument()

    expect(await screen.findByText('Build system')).toBeInTheDocument()
    expect(screen.getByText('Feature-Sliced architecture')).toBeInTheDocument()
  })
})
