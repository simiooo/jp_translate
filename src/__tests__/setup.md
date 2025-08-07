# Test Setup File

This file (`setup.ts`) should be created to set up the testing environment for React components.

Content for `setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

This setup file will:
1. Import the necessary Jest DOM matchers for Vitest
2. Make testing utilities available globally in test files

The vitest.config.ts file should also be updated to include this setup file:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.ts'],
        browser: {
            enabled: true,
            provider: 'playwright',
            instances: [
                { browser: 'chromium' },
            ],
        },
    }
})