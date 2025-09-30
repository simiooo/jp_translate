# Component Test Examples

This document provides examples of how to create snapshot tests for different types of components in the project.

## Simple Component - Button

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

## Component with State - Switch

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Switch } from '../components/Switch'

describe('Switch', () => {
  it('renders correctly in unchecked state', () => {
    const { container } = render(<Switch />)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly in checked state', () => {
    const { container } = render(<Switch initialChecked={true} />)
    expect(container).toMatchSnapshot()
  })
})
```

## Component with Complex Props - Input

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Input } from '../components/Input'

describe('Input', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Input />)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with label', () => {
    const { container } = render(<Input label="Email" />)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with error', () => {
    const { container } = render(<Input error="This field is required" />)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly when disabled', () => {
    const { container } = render(<Input disabled />)
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with different sizes', () => {
    const { container: sm } = render(<Input size="sm" />)
    expect(sm).toMatchSnapshot()

    const { container: md } = render(<Input size="md" />)
    expect(md).toMatchSnapshot()

    const { container: lg } = render(<Input size="lg" />)
    expect(lg).toMatchSnapshot()
  })
})
```

## Component with Children - Modal

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Modal } from '../components/Modal'

describe('Modal', () => {
  it('renders correctly with content', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )
    expect(container).toMatchSnapshot()
  })

  it('renders correctly when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )
    expect(container).toMatchSnapshot()
  })
})
```

## Component with Icons - CircleButton

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CircleButton } from '../components/CircleButton'
import { FaPlus } from 'react-icons/fa'

describe('CircleButton', () => {
  it('renders correctly with icon', () => {
    const { container } = render(
      <CircleButton>
        <FaPlus />
      </CircleButton>
    )
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with different sizes', () => {
    const { container: sm } = render(
      <CircleButton size="sm">
        <FaPlus />
      </CircleButton>
    )
    expect(sm).toMatchSnapshot()

    const { container: md } = render(
      <CircleButton size="md">
        <FaPlus />
      </CircleButton>
    )
    expect(md).toMatchSnapshot()

    const { container: lg } = render(
      <CircleButton size="lg">
        <FaPlus />
      </CircleButton>
    )
    expect(lg).toMatchSnapshot()
  })
})
```

## Component with Conditional Rendering - Toast

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Toast } from '../components/Toast'

describe('Toast', () => {
  it('renders correctly with success variant', () => {
    const { container } = render(
      <Toast variant="success" message="Operation completed successfully" />
    )
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with error variant', () => {
    const { container } = render(
      <Toast variant="error" message="An error occurred" />
    )
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with warning variant', () => {
    const { container } = render(
      <Toast variant="warning" message="Please check your input" />
    )
    expect(container).toMatchSnapshot()
  })

  it('renders correctly with info variant', () => {
    const { container } = render(
      <Toast variant="info" message="Information message" />
    )
    expect(container).toMatchSnapshot()
  })
})
```

## Testing Strategy Guidelines

1. **Test Default States**: Always test components with their default props to capture the baseline appearance.

2. **Test All Variants**: For components with multiple variants (like Button with different styles), create separate snapshots for each variant.

3. **Test All Sizes**: For components with size options, create separate snapshots for each size.

4. **Test Conditional Rendering**: For components that render differently based on props (like Modal with isOpen), test both states.

5. **Test Edge Cases**: Test components with error states, loading states, disabled states, etc.

6. **Test with Children**: For components that accept children, test with typical content.

7. **Avoid Implementation Details**: Focus on the rendered output rather than internal implementation details.

8. **Keep Snapshots Readable**: Ensure snapshots are meaningful and not too large. For very complex components, consider testing smaller parts separately.

## Running Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm test -- --watch
```

To update snapshots when components change intentionally:
```bash
npm test -- -u