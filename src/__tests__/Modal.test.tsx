import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Modal } from '../components/Modal'

describe('Modal', () => {
  it('renders correctly with default props', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Test Content</div>
      </Modal>
    )
    expect(container).toMatchSnapshot()
  })
})