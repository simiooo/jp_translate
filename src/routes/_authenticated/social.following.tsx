import { createFileRoute } from '@tanstack/react-router'
import FollowingPage from '../../pages/social/FollowingPage'

export const Route = createFileRoute('/_authenticated/social/following')({
  component: FollowingPage,
})