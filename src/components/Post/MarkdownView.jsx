import { useContext, useEffect, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import MessageBox from '../UI/MessageBox'
import { Fragment } from 'react'
import { postContext, usePostContext } from '../../hooks/usePostContext'
import ErrorBlock from '../UI/ErrorBlock'

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
  const { setIsCompiled } = usePostContext()

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
        setIsCompiled(true)
        setError({ msg: undefined })
      } catch (e) {
        console.log(e.message)
        setError({ msg: e.message })
      }
    })()
  }, [text])

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
