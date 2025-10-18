import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ThemeProvider } from '~/components/theme-provider'
import { Toaster } from "~/components/ui/sonner"
import "~/i18n" // Import i18n configuration
import appCss  from "@/styles/app.css?url"

// import { ErrorBoundary } from '~/components/ErrorBoundary'

export const Route = createRootRoute({
  // errorComponent: ErrorBoundary,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Risu Japanese',
      },
    ],
    links: [
      { rel: "icon",type:"image/x-icon", href: "/logo-180.png" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Outlet />
        <Toaster />
      </ThemeProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        
      </body>
    </html>
  )
}