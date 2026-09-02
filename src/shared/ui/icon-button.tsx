import type { ComponentPropsWithoutRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  icon: LucideIcon
  label: string
}

export function IconButton({
  className,
  icon: Icon,
  label,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950 focus:ring-2 focus:ring-teal-600/25 focus:outline-none',
        className,
      )}
      title={label}
      type={type}
      {...props}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}
