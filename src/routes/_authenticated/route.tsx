import { createFileRoute } from '@tanstack/react-router'
import RootLayout from '~/layout/rootLayout'

export const Route = createFileRoute('/_authenticated')({
  component: RootLayout,
})
