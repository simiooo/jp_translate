import { createFileRoute } from '@tanstack/react-router'
import Recognize from '../../pages/Recognize'

export const Route = createFileRoute('/_authenticated/recognize')({
  component: Recognize,
})