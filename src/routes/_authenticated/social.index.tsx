import { createFileRoute } from '@tanstack/react-router'
import HomePage from '../../pages/social/HomePage'

export const Route = createFileRoute('/_authenticated/social/')({
  component: HomePage,
})