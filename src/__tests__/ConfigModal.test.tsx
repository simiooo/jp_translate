import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ConfigModal } from '../components/ConfigModal'

describe('ConfigModal', () => {
  it('renders correctly with default props', () => {
    const initialConfig = {
      apiUrl: '',
      apiKey: '',
      model: '',
      openaiApiUrl: '',
      openaiApiKey: '',
      voice: ''
    }
    const { container } = render(
      <ConfigModal 
        isOpen={true} 
        onClose={() => {}} 
        onSave={() => {}} 
        initialConfig={initialConfig} 
      />
    )
    expect(container).toMatchSnapshot()
  })
})