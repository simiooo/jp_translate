import { createFileRoute } from '@tanstack/react-router'
import SocialLayout from '../../layout/socialLayout'

export const Route = createFileRoute('/_authenticated/social')({
  component: SocialLayout,
})