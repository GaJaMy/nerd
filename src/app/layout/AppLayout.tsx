import { Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { BrainCircuit, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { DensityToggle } from '@/features/preferences/toggle-density'
import { env } from '@/shared/config/env'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-[#f8f8f4] text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#f8f8f4]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            className="flex min-w-0 items-center gap-3 rounded-md text-zinc-950"
            to="/"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
              <BrainCircuit aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="truncate font-semibold">{env.VITE_APP_NAME}</span>
          </Link>

          <nav className="ml-auto flex items-center gap-2">
            <NavLink icon={LayoutDashboard} label="Workspace" to="/" />
          </nav>

          <DensityToggle />
        </div>
      </header>

      <Outlet />

      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </div>
  )
}

function NavLink({
  icon: Icon,
  label,
  to,
}: {
  icon: LucideIcon
  label: string
  to: '/'
}) {
  return (
    <Link
      activeOptions={{ exact: true }}
      activeProps={{
        className: 'border-zinc-950 bg-zinc-950 text-white',
      }}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
      inactiveProps={{
        className: 'border-zinc-300 bg-white text-zinc-700',
      }}
      to={to}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}
