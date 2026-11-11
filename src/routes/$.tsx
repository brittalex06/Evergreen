import { createFileRoute } from '@tanstack/react-router'
import { EvergreenApp } from '../components/evergreen'
export const Route = createFileRoute('/$')({ component: EvergreenApp })
