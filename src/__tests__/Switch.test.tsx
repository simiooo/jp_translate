import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Switch } from '../components/Switch'

describe('Switch', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Switch />)
    expect(container).toMatchSnapshot()
  })
})