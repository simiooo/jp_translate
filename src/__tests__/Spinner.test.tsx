import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Spinner from '../components/Spinner'

describe('Spinner', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Spinner />)
    expect(container).toMatchSnapshot()
  })
})