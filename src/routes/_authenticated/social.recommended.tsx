import { createFileRoute } from '@tanstack/react-router'
import RecommendedPage from '../../pages/social/RecommendedPage'

export const Route = createFileRoute('/_authenticated/social/recommended')({
  component: RecommendedPage,
})