import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Checkbox } from '../components/Checkbox'

describe('Checkbox', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Checkbox />)
    expect(container).toMatchSnapshot()
  })
})