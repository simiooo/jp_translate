import { createFileRoute } from '@tanstack/react-router'
import MyPostsPage from '../../pages/social/MyPostsPage'

export const Route = createFileRoute('/_authenticated/social/my-posts')({
  component: MyPostsPage,
})