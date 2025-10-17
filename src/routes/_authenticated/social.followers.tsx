import { createFileRoute } from '@tanstack/react-router'
import FollowersPage from '../../pages/social/FollowersPage'

export const Route = createFileRoute('/_authenticated/social/followers')({
  component: FollowersPage,
})