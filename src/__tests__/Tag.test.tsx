import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Tag } from '../components/Tag'

describe('Tag', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Tag label="Test Tag" type="pos" />)
    expect(container).toMatchSnapshot()
  })
})