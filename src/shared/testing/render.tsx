import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export function renderWithClient(ui: ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return {
    queryClient: testQueryClient,
    ...render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>),
  }
}
