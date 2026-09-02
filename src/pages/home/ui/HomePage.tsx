import { WorkspaceReadiness } from '@/widgets/workspace-readiness'

export function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold tracking-[0.18em] text-teal-700 uppercase">
          Frontend-only React workspace
        </p>
        <h1 className="text-3xl leading-tight font-semibold text-zinc-950 sm:text-4xl">
          Typed, testable, feature-sliced React project ready for AI-assisted work.
        </h1>
        <p className="text-base leading-7 text-zinc-600">
          This starter keeps app wiring, pages, features, entities, and shared code in
          separate layers so future product work has clear boundaries from day one.
        </p>
      </section>

      <WorkspaceReadiness />
    </main>
  )
}
