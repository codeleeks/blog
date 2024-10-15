import { Fragment, useEffect, useRef, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import ErrorBlock from './ErrorBlock'

const MessageBox = (props) => {
  const { title, level, children } = props
  return (
    <div className={`article-article__contents__message-box ${level}`}>
      <h6 className='article-article__contents__message-box__message-title'>
        {title}
      </h6>
      <div className='article-article__contents__message-box__message-contents'>
        {children}
      </div>
    </div>
  )
}

export const components = {
  MessageBox(props) {
    const { children, ...rest } = props
    return <MessageBox {...rest}>{children}</MessageBox>
  },
  code({ className, ...properties }) {
    const match = /language-(\w+)/.exec(className || '')
    return (
      <code
        className={match ? className : `hljs language-plaintext`}
        {...properties}
      />
    )
  },
  a({ children, ...rest }) {
    return (
      <a {...rest} target='_blank'>
        {children}
      </a>
    )
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

const Markdown = (props) => {
  const { text, startHeadingObserver } = props
  const [mdxModule, setMdxModule] = useState(null)
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
    if (mdxModule && startHeadingObserver) {
      startHeadingObserver(text)
    }
  }, [mdxModule, text, startHeadingObserver])

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

export default Markdown
