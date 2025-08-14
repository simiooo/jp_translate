import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import WordCard from '../components/WordCard'

describe('WordCard', () => {
  it('renders correctly with default props', () => {
    const token = {
      word: 'Test Word',
      pos: 'verb' as const,
      kana: 'テスト',
      meaning: 'Test meaning',
      lemma: 'Test lemma',
      inflection: 'Test inflection',
      position: {
        start: 0,
        end: 5
      }
    }
    const { container } = render(<WordCard token={token} />)
    expect(container).toMatchSnapshot()
  })
})