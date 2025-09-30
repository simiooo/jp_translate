import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '../components/Button'

describe('Button', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Button>Click me</Button>)
    expect(container).toMatchSnapshot()
  })
})