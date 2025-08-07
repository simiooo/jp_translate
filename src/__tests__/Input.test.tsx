import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Input } from '../components/Input'

describe('Input', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Input label="Test Input" name="test" />)
    expect(container).toMatchSnapshot()
  })
})