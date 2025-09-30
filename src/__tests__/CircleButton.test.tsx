import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CircleButton } from '../components/CircleButton'

describe('CircleButton', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<CircleButton onClick={() => {}}>Test</CircleButton>)
    expect(container).toMatchSnapshot()
  })
})