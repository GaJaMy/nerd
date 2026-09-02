import { CheckCircle2 } from 'lucide-react'

type ToolingCardProps = {
  item: {
    description: string
    name: string
  }
}

export function ToolingCard({ item }: ToolingCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-teal-700" />
      <h2 className="mt-4 text-base font-semibold text-zinc-950">{item.name}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
    </article>
  )
}
