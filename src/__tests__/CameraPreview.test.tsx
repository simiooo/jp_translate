import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import CameraPreview from '../components/CameraPreview'

describe('CameraPreview', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<CameraPreview />)
    expect(container).toMatchSnapshot()
  })
})