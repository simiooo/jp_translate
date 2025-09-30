# Comprehensive Test Implementation Plan

This document outlines the complete plan for implementing snapshot tests for all React components in the `src/components` directory.

## Prerequisites

Before implementing the tests, ensure the following steps are completed:

1. Install required dependencies:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
   ```

2. Update `vitest.config.ts` to include proper React testing configuration:
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

3. Create `src/__tests__/setup.ts`:
   ```typescript
   import '@testing-library/jest-dom/vitest'
   ```

## Implementation Steps

### Step 1: Create Test Files for Each Component

Create a test file for each component in `src/components` with the naming convention `[ComponentName].test.tsx` in the `src/__tests__` directory.

#### Components to Test:

1. **AstTokens.tsx**
   - Test with default props
   - Test with different token types if applicable

2. **Button.tsx**
   - Test with default props
   - Test with loading state
   - Test with all variants (primary, secondary, link, normal, text)
   - Test with all sizes (sm, md, lg)

3. **CameraPreview.tsx**
   - Test with default props
   - Test with different aspect ratios if applicable

4. **Checkbox.tsx**
   - Test in unchecked state
   - Test in checked state
   - Test in indeterminate state if applicable
   - Test when disabled

5. **CircleButton.tsx**
   - Test with default props
   - Test with different sizes (sm, md, lg)
   - Test with icon children

6. **CircularSelect.tsx**
   - Test with default props
   - Test with options
   - Test in different states if applicable

7. **ConfigModal.tsx**
   - Test when open
   - Test when closed
   - Test with content

8. **Cursor.tsx**
   - Test with default props
   - Test with different states if applicable

9. **ErrorBoundary.tsx**
   - Test in normal state
   - Test when catching an error (may need special handling)

10. **GlobalSpinner.tsx**
    - Test when visible
    - Test when hidden

11. **HistorySidebar.tsx**
    - Test with default props
    - Test with history items if applicable

12. **HydrateFallback.tsx**
    - Test with default props
    - Test different loading states if applicable

13. **ImageUploader.tsx**
    - Test with default props
    - Test with image preview if applicable
    - Test with error states if applicable

14. **ImgPreview.tsx**
    - Test with default props
    - Test with image source

15. **Input.tsx**
    - Test with default props
    - Test with label
    - Test with error message
    - Test when disabled
    - Test with different sizes (sm, md, lg)

16. **Modal.tsx**
    - Test when open
    - Test when closed
    - Test with content

17. **Reasoning.tsx**
    - Test with default props
    - Test with reasoning content

18. **Select.tsx**
    - Test with default props
    - Test with options
    - Test with different sizes
    - Test when disabled

19. **Spinner.tsx**
    - Test with default props
    - Test with different sizes if applicable

20. **Switch.tsx**
    - Test in unchecked state
    - Test in checked state

21. **Tag.tsx**
    - Test with default props
    - Test with different variants if applicable
    - Test with different sizes if applicable

22. **TitleBar.tsx**
    - Test with default props
    - Test with title content

23. **Toast.tsx**
    - Test with success variant
    - Test with error variant
    - Test with warning variant
    - Test with info variant

24. **Tooltip.tsx**
    - Test with default props
    - Test with content

25. **TypewriterText.tsx**
    - Test with default props
    - Test with text content

26. **WordCard.tsx**
    - Test with default props
    - Test with word data

### Step 2: Run Initial Test Suite

After creating all test files, run the test suite to generate initial snapshots:

```bash
npm test
```

### Step 3: Review and Validate Snapshots

Review all generated snapshots to ensure they accurately represent the components:

1. Check that snapshots are not empty
2. Verify that snapshots capture the expected component structure
3. Ensure snapshots are readable and meaningful
4. Confirm that all variants and states are properly captured

### Step 4: Add to Version Control

Add all test files and snapshots to version control:

```bash
git add src/__tests__/
```

## Test File Template

Use the following template for creating test files:

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ComponentName } from '../components/ComponentName'

describe('ComponentName', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<ComponentName />)
    expect(container).toMatchSnapshot()
  })
  
  // Add additional test cases as needed
})
```

## Quality Assurance

1. **Code Coverage**: Ensure all components have at least one snapshot test
2. **Variant Coverage**: Ensure all component variants are tested
3. **State Coverage**: Ensure all component states are tested
4. **Readability**: Ensure snapshots are readable and meaningful
5. **Maintenance**: Ensure tests are easy to update when components change

## Maintenance Guidelines

1. **When Components Change**: Update snapshots using `npm test -- -u`
2. **When Adding New Components**: Create corresponding test files
3. **When Removing Components**: Remove corresponding test files
4. **Regular Review**: Periodically review snapshots to ensure they remain relevant

## Troubleshooting

### Common Issues

1. **Snapshot Test Failures**: 
   - If a component intentionally changes, update snapshots with `npm test -- -u`
   - If a component unintentionally changes, investigate the cause

2. **Missing Dependencies**: 
   - Ensure all required testing dependencies are installed

3. **Configuration Issues**: 
   - Verify vitest.config.ts is properly configured
   - Ensure setup.ts is correctly implemented

### Debugging Tips

1. Use `console.log` in tests to inspect component output
2. Use `debug()` from `@testing-library/react` to print component HTML
3. Run tests in watch mode for faster feedback during development

## Next Steps

1. Implement the test files according to this plan
2. Run the test suite and generate initial snapshots
3. Review and validate all snapshots
4. Add tests to version control
5. Document the testing process for future reference