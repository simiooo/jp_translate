import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Select } from '../components/Select'

describe('Select', () => {
  it('renders correctly with default props', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ]
    const { container } = render(<Select options={options} />)
    expect(container).toMatchSnapshot()
  })
})