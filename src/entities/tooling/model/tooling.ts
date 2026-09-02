import { z } from 'zod'

const readinessItemSchema = z.object({
  detail: z.string(),
  id: z.string(),
  status: z.enum(['ready', 'next']),
  title: z.string(),
})

const readinessItems = [
  {
    detail: 'Vite, React Compiler, Tailwind, and TypeScript path aliases are wired.',
    id: 'build',
    status: 'ready',
    title: 'Build system',
  },
  {
    detail: 'TanStack Router and Query are ready for frontend routing and server state.',
    id: 'routing-data',
    status: 'ready',
    title: 'Routing and data',
  },
  {
    detail:
      'Vitest, Testing Library, MSW, and Playwright give agent changes fast feedback.',
    id: 'testing',
    status: 'ready',
    title: 'Testing loop',
  },
  {
    detail:
      'AGENTS.md, README, ESLint, Prettier, and Knip document and enforce conventions.',
    id: 'ai-workflow',
    status: 'ready',
    title: 'AI-assisted workflow',
  },
] satisfies z.infer<typeof readinessItemSchema>[]

export const toolingItems = [
  {
    description:
      'Fast local dev server, optimized production builds, route code splitting.',
    name: 'Vite + React 19',
  },
  {
    description: 'Strict mode, path aliases, generated route types, safer refactors.',
    name: 'TypeScript 6',
  },
  {
    description:
      'Unit, component, API mock, and browser E2E tests for confident iteration.',
    name: 'Vitest + Playwright',
  },
  {
    description: 'Fast linting, type-aware rules, formatting, and unused-code detection.',
    name: 'Quality gates',
  },
]

export const architectureLayers = [
  {
    description: 'App composition: providers, router, routes, global styles.',
    name: 'app',
  },
  {
    description: 'Route-level screens assembled from widgets and features.',
    name: 'pages',
  },
  {
    description: 'Large page blocks that combine features and entities.',
    name: 'widgets',
  },
  {
    description: 'User actions and use cases, such as toggles, filters, forms.',
    name: 'features',
  },
  {
    description: 'Business/domain objects, model logic, and domain-specific UI.',
    name: 'entities',
  },
  {
    description: 'Reusable UI, API clients, config, libraries, and testing utilities.',
    name: 'shared',
  },
]

export async function getReadinessItems() {
  await new Promise((resolve) => window.setTimeout(resolve, 120))

  return z.array(readinessItemSchema).parse(readinessItems)
}
