# React Component Snapshot Testing Plan

This document outlines the approach for implementing snapshot tests for all React components in the `src/components` directory using Vitest.

## Required Dependencies

Before implementing the tests, the following dependencies need to be installed:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
```

## Test Configuration

The project already has a `vitest.config.ts` file with browser testing enabled. We'll need to update it to properly support React component testing:

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
```

We also need to create a setup file at `src/__tests__/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

## Test File Structure

Each component will have a corresponding test file in the `src/__tests__` directory with the naming convention `[ComponentName].test.tsx`.

## Example Test Implementation

Here's how we'll implement snapshot tests for the Button component:

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '../components/Button'

describe('Button', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Button>Click me</Button>)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly when loading', () => {
    const { container } = render(<Button loading>Click me</Button>)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with different variants', () => {
    const { container: primary } = render(<Button variant="primary">Primary</Button>)
    expect(primary).toMatchSnapshot()

    const { container: secondary } = render(<Button variant="secondary">Secondary</Button>)
    expect(secondary).toMatchSnapshot()

    const { container: link } = render(<Button variant="link">Link</Button>)
    expect(link).toMatchSnapshot()

    const { container: normal } = render(<Button variant="normal">Normal</Button>)
    expect(normal).toMatchSnapshot()

    const { container: text } = render(<Button variant="text">Text</Button>)
    expect(text).toMatchSnapshot()
  })

  it('renders correctly with different sizes', () => {
    const { container: sm } = render(<Button size="sm">Small</Button>)
    expect(sm).toMatchSnapshot()

    const { container: md } = render(<Button size="md">Medium</Button>)
    expect(md).toMatchSnapshot()

    const { container: lg } = render(<Button size="lg">Large</Button>)
    expect(lg).toMatchSnapshot()
  })
})
```

## Complete List of Components to Test

The following components in `src/components` need snapshot tests:

1. AstTokens.tsx
2. Button.tsx
3. CameraPreview.tsx
4. Checkbox.tsx
5. CircleButton.tsx
6. CircularSelect.tsx
7. ConfigModal.tsx
8. Cursor.tsx
9. ErrorBoundary.tsx
10. GlobalSpinner.tsx
11. HistorySidebar.tsx
12. HydrateFallback.tsx
13. ImageUploader.tsx
14. ImgPreview.tsx
15. Input.tsx
16. Modal.tsx
17. Reasoning.tsx
18. Select.tsx
19. Spinner.tsx
20. Switch.tsx
21. Tag.tsx
22. TitleBar.tsx
23. Toast.tsx
24. Tooltip.tsx
25. TypewriterText.tsx
26. WordCard.tsx

## Implementation Approach

1. Create the setup file and update the vitest configuration
2. Implement snapshot tests for each component following the pattern shown above
3. For components with props that significantly change their appearance, create multiple snapshots to cover different prop combinations
4. Run the tests to generate initial snapshots
5. Review snapshots to ensure they capture the expected component structure
6. Add any additional test cases as needed for components with complex behavior

## Running Tests

Tests can be run using the following command:

```bash
npm test
```

Or to run tests in watch mode:

```bash
npm test -- --watch
```

## Snapshot Updates

When components are intentionally modified, snapshots will need to be updated:

```bash
npm test -- -u
```

This command will update all failing snapshots to match the current component output.