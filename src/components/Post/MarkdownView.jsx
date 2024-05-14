import { useContext, useEffect, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import MessageBox from '../UI/MessageBox'
import { Fragment } from 'react'
import { postContext, usePostContext } from '../../hooks/usePostContext'

const components = {
  MessageBox(props) {
    const { children, ...rest } = props
    return <MessageBox {...rest}>{children}</MessageBox>
  },
}
export default (props) => {
  const { text } = props
  const [mdxModule, setMdxModule] = useState()
  const {setIsCompiled} = usePostContext()

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
      } catch (e) {
        console.log(e.message)
      }
    })()
    
  }, [text])

  let Content = Fragment
  if (mdxModule) {
    Content = mdxModule.default
    return <Content components={components} />
  }
  

  return <Content />
}
