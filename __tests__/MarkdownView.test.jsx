import { render, screen } from '@testing-library/react'
import { describe, it } from 'vitest'
import {
  evaluateMarkdown,
  components,
} from '../src/components/Post/MarkdownView'
import { skipMetadata } from '../src/utils/post'

describe('markdown', async () => {
  const resp = await fetch(
    'https://raw.githubusercontent.com/codeleeks/blog/codeleeks-posts/javascript/%EC%A0%95%EA%B7%9C%ED%91%9C%ED%98%84%EC%8B%9D%20%EC%99%84%EB%B2%BD%20%EC%A0%95%EB%A6%AC.md'
  )
  const sampleMarkdown = await resp.text()
  const skipped = skipMetadata(sampleMarkdown)

  async function MarkdownTestView(skipped) {
    const mdxModule = await evaluateMarkdown(skipped)
    return render(<mdxModule.default components={components} />)
  }

  it('should render', async () => {
    await MarkdownTestView(skipped)
  })

  it('MessageBox should not have empty title and contents', async () => {
    const { container } = await MarkdownTestView(skipped)

    const messageBox = container.querySelector('.message-box')
    if (messageBox) {
      const messageBoxTitle = messageBox.querySelector('.message-title')
      const messageBoxBody = messageBox.querySelector('.message-contents')

      expect(messageBoxTitle.textContent).not.toBe('')
      expect(messageBoxBody.textContent).not.toBe('')
    }
  })
})
