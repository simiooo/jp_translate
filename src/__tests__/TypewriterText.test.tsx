import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TypewriterText } from '../components/TypewriterText'

describe('TypewriterText', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<TypewriterText text="Test text" />)
    expect(container).toMatchSnapshot()
  })
})