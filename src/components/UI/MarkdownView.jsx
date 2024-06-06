import { useEffect, useLayoutEffect, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import MessageBox from './MessageBox'
import { Fragment } from 'react'
import ErrorBlock from './ErrorBlock'
import { postTocObserver } from '../../utils/toc'

export const components = {
  MessageBox(props) {
    const { children, ...rest } = props
    return <MessageBox {...rest}>{children}</MessageBox>
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
  const { text } = props
  const [mdxModule, setMdxModule] = useState()
  const [error, setError] = useState({ msg: undefined })

  useEffect(() => {
    ;(async () => {
      try {
        const module = await evaluate(text, {
          ...runtime,
          baseUrl: import.meta.url,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight, rehypeSlug],
        })
        setMdxModule(module)
        setError({ msg: undefined })
      } catch (e) {
        console.log(e.message)
        setError({ msg: e.message })
      }
    })()
  }, [text])

  useLayoutEffect(() => {
    const contentsHeadingEls = document
      .querySelector('.post-page .post .contents')
      .querySelectorAll('h1,h2,h3,h4,h5,h6')
    postTocObserver.start(contentsHeadingEls)
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
