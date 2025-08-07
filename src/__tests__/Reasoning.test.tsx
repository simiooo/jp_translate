import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Reasoning } from '../components/Reasoning'

describe('Reasoning', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Reasoning thinking="Test reasoning content" />)
    expect(container).toMatchSnapshot()
  })
})