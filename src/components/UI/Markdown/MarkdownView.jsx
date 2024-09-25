import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import rehypeHighlight from 'rehype-highlight'
import SyntaxHighlighter from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import MessageBox from './MessageBox'
import { Fragment } from 'react'
import ErrorBlock from '../ErrorBlock'

function code({ className, ...properties }) {
  const match = /language-(\w+)/.exec(className || '')
  return match ? (
    <SyntaxHighlighter language={match[1]} {...properties} />
  ) : (
    <code className={className} {...properties} />
  )
}

export const components = {
  MessageBox(props) {
    const { children, ...rest } = props
    return <MessageBox {...rest}>{children}</MessageBox>
  },
  code({ className, ...properties }) {
    const match = /language-(\w+)/.exec(className || '')
    return <code className={match ? className : `hljs language-plaintext`} {...properties} />
  },
}

export async function evaluateMarkdown(text) {
  const module = await evaluate(text, {
    ...runtime,
    baseUrl: import.meta.url,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight, rehypeSlug],
  })
  return module
}
export default (props) => {
  const { text, observeHeadings } = props
  const [mdxModule, setMdxModule] = useState()
  const [error, setError] = useState({ msg: undefined })

  useEffect(() => {
    ;(async () => {
      try {
        const module = await evaluateMarkdown(text)
        setMdxModule(module)
        setError({ msg: undefined })
      } catch (e) {
        console.log(e.message)
        setError({ msg: e.message })
      }
    })()
  }, [text])

  useEffect(() => {
    observeHeadings()
  }, [mdxModule])

  let Content = Fragment
  if (error.msg) {
    Content = <ErrorBlock title='An Error Occurred!' message={error.msg} />
    return Content
  }
  if (mdxModule) {
    Content = mdxModule.default
    return <Content components={components} />
  }

  return <Content />
}
