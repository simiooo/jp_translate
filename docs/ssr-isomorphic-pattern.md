# SSR Isomorphic Pattern Usage

This document explains how to use the `createIsomorphicFn` from `@tanstack/react-start` to adapt components for Server-Side Rendering (SSR).

## Overview

The isomorphic pattern allows you to create functions that have different implementations for server and client environments. This is particularly useful when dealing with browser-specific APIs like `localStorage`, `window`, or `document` that are not available during server-side rendering.

## Basic Syntax

```typescript
import { createIsomorphicFn } from "@tanstack/react-start"

const myFunction = createIsomorphicFn()
  .server(() => {
    // Server-side implementation
    // This code runs only on the server
    // For client APIs, do nothing here
  })
  .client(() => {
    // Client-side implementation
    // This code runs only in the browser
  })

// Usage
const result = myFunction()
```

## Theme Provider Example

Below is the complete implementation of the theme provider using the isomorphic pattern:

```typescript
import { createContext, useContext, useEffect, useState } from "react"
import { createIsomorphicFn } from "@tanstack/react-start"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const getInitialTheme = createIsomorphicFn()
      .server(() => defaultTheme)
      .client(() => (localStorage.getItem(storageKey) as Theme) || defaultTheme)
    
    return getInitialTheme()
  })
  
  useEffect(() => {
    const applyTheme = createIsomorphicFn()
      .server(() => {})
      .client(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light"

          root.classList.add(systemTheme)
          return
        }

        root.classList.add(theme)
      })
    
    applyTheme()
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      const saveTheme = createIsomorphicFn()
        .server(() => {})
        .client(() => localStorage.setItem(storageKey, newTheme))
      
      saveTheme()
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
```

## Key Use Cases

### 1. Accessing Browser APIs

```typescript
const getDeviceInfo = createIsomorphicFn()
  .server(() => ({ type: 'server', platform: process.platform }))
  .client(() => ({ type: 'client', userAgent: navigator.userAgent }))
```

### 2. LocalStorage Operations

```typescript
const getStoredValue = createIsomorphicFn()
  .server(() => defaultValue)
  .client(() => localStorage.getItem('key') || defaultValue)

const saveValue = createIsomorphicFn()
  .server(() => {})
  .client((value) => localStorage.setItem('key', value))
```

### 3. DOM Manipulation

```typescript
const updateDOM = createIsomorphicFn()
  .server(() => {})
  .client(() => {
    document.body.classList.add('loaded')
  })
```

## Best Practices

1. **Server-side**: Always provide a fallback or default value for server-side execution
2. **Client-side**: Implement the full browser-specific functionality
3. **State Management**: Initialize state with isomorphic functions to ensure consistency
4. **Side Effects**: Wrap side effects in isomorphic functions within useEffect hooks

## Benefits

- **SSR Compatibility**: Prevents hydration mismatches and server-side errors
- **Clean Code**: Separates server and client logic clearly
- **Type Safety**: Maintains TypeScript support throughout the implementation
- **Performance**: Avoids unnecessary operations on the server side

## Common Pitfalls

1. Don't access browser APIs directly in components without isomorphic wrappers
2. Remember that server-side implementation should not depend on client-side state
3. Ensure that server and client implementations return compatible types
4. Test both server-side rendering and client-side hydration