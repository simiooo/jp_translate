import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Cursor } from '../components/Cursor'

describe('Cursor', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Cursor />)
    expect(container).toMatchSnapshot()
  })
})