import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/a11y-dark.css'

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

  return (
    <article style={{ textAlign: 'left' }}>
      <ReactMarkdown rehypePlugins={[rehypeHighlight, rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </article>
  )
}
