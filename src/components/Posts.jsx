import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/a11y-dark.css'
import { createGithubCommit } from '../utils/github.js'
import { parseTextFromMarkDown } from '../utils/markdown.js'

export default (props) => {
  const [content, setContent] = useState()
  useEffect(() => {
    async function fetchPost() {
      const md = await fetch(
        'https://raw.githubusercontent.com/codeleeks/blog/main/posts/Frontend/helloworld.md'
      )
      const mdText = await md.text()
      setContent(mdText)
    }
    fetchPost()
  }, [])

  async function handleClick() {
    const token = import.meta.env.VITE_GITHUB_ACCESS_TOKEN
    const fileName = 'test.md'
    console.log(token)

    try {
      // await createGithubCommit(
      //   token,
      //   'codeleeks',
      //   'blog',
      //   'test-commit',
      //   'Posting a new article.',
      //   [
      //     {
      //       content,
      //       path: `/posts/Frontend/${fileName}`,
      //     },
      //   ]
      // )
      setContent(parseTextFromMarkDown(content))
    } catch (error) {
      console.log(error)
      console.log(error.message)
    }
  }

  console.log(content)

  return (
    <article style={{ textAlign: 'left' }}>
      <ReactMarkdown rehypePlugins={[rehypeHighlight, rehypeRaw]}>
        {content}
      </ReactMarkdown>
      <button onClick={handleClick}>Save</button>
    </article>
  )
}
