import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Tooltip } from '../components/Tooltip'

describe('Tooltip', () => {
  it('renders correctly with default props', () => {
    const { container } = render(
      <Tooltip content="Test tooltip">
        <span>Hover me</span>
      </Tooltip>
    )
    expect(container).toMatchSnapshot()
  })
})