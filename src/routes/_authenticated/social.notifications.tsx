import { createFileRoute } from '@tanstack/react-router'
import NotificationsPage from '../../pages/social/NotificationsPage'

export const Route = createFileRoute('/_authenticated/social/notifications')({
  component: NotificationsPage,
})