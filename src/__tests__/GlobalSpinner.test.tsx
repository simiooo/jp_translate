import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import GlobalSpinner from '../components/GlobalSpinner'

describe('GlobalSpinner', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<GlobalSpinner />)
    expect(container).toMatchSnapshot()
  })
})