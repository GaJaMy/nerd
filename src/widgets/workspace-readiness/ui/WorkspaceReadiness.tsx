import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, ListChecks } from 'lucide-react'
import {
  architectureLayers,
  getReadinessItems,
  toolingItems,
} from '@/entities/tooling/model/tooling'
import { ToolingCard } from '@/entities/tooling/ui/ToolingCard'

export function WorkspaceReadiness() {
  const readinessQuery = useQuery({
    queryFn: getReadinessItems,
    queryKey: ['workspace-readiness'],
  })

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ListChecks aria-hidden="true" className="h-5 w-5 text-teal-700" />
          <h2 className="text-lg font-semibold text-zinc-950">Workspace baseline</h2>
        </div>
        <div className="mt-6 space-y-4">
          {readinessQuery.isPending ? (
            <p className="text-sm text-zinc-500">Checking workspace...</p>
          ) : null}
          {readinessQuery.data?.map((item) => (
            <article key={item.id} className="flex gap-3 border-t border-zinc-100 pt-4">
              <CheckCircle2
                aria-hidden="true"
                className={
                  item.status === 'ready'
                    ? 'mt-0.5 h-5 w-5 shrink-0 text-emerald-600'
                    : 'mt-0.5 h-5 w-5 shrink-0 text-amber-500'
                }
              />
              <div>
                <h3 className="font-medium text-zinc-950">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {toolingItems.map((item) => (
            <ToolingCard key={item.name} item={item} />
          ))}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
          <h2 className="text-base font-semibold">Feature-Sliced architecture</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {architectureLayers.map((layer) => (
              <li key={layer.name} className="rounded-md border border-white/10 p-3">
                <p className="font-medium">{layer.name}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-300">
                  {layer.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
