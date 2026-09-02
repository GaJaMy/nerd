import { createFileRoute } from '@tanstack/react-router'
import { ErdEditorPage } from '@/pages/erd-editor'

export const Route = createFileRoute('/')({
  component: ErdEditorPage,
})
