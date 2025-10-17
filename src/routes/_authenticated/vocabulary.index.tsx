import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/vocabulary/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/vocabulary/"!</div>
}
