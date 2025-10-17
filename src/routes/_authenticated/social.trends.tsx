import { createFileRoute } from '@tanstack/react-router'
import TrendsPage from '../../pages/social/TrendsPage'

export const Route = createFileRoute('/_authenticated/social/trends')({
  component: TrendsPage,
})