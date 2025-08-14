import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AstTokens } from '../components/AstTokens'

describe('AstTokens', () => {
  it('renders correctly with default props', () => {
    const ast = {
      type: 'sentence' as const,
      tokens: [
        {
          word: 'Test Word',
          pos: 'verb' as const,
          meaning: 'Test meaning',
          kana: 'テスト',
          lemma: 'Test lemma',
          inflection: 'Test inflection',
          position: {
            start: 0,
            end: 5
          }
        }
      ]
    }
    const { container } = render(<AstTokens ast={ast} />)
    expect(container).toMatchSnapshot()
  })
})