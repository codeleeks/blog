import { Fragment, useEffect, useRef, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import ErrorBlock from './ErrorBlock'
import { MDXModule } from 'mdx/types'

const MessageBox = (props: any) => {
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
  MessageBox(props: any) {
    const { children, ...rest } = props
    return <MessageBox {...rest}>{children}</MessageBox>
  },
  code({ className, ...properties }: any) {
    const match = /language-(\w+)/.exec(className || '')
    return (
      <code
        className={match ? className : `hljs language-plaintext`}
        {...properties}
      />
    )
  },
  a({ children, ...rest }: any) {
    return (
      <a {...rest} target='_blank'>
        {children}
      </a>
    )
  },
}

export async function evaluateMarkdown(text: string) {
  const module = await evaluate(text, {
    ...runtime,
    baseUrl: import.meta.url,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight, rehypeSlug],
  })
  return module
}

interface MarkdownProps {
  text: string
  startHeadingObserver?: (contents: string) => void
}

const Markdown = (props: MarkdownProps) => {
  const { text, startHeadingObserver } = props
  const [mdxModule, setMdxModule] = useState<MDXModule>(null)
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
    return <ErrorBlock title='An Error Occurred!' message={error.msg} />
  }
  if (mdxModule) {
    return <mdxModule.default components={components} />
  }

  return <Content />
}

export default Markdown
