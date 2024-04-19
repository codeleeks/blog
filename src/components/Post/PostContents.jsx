import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeRaw from 'rehype-raw'
import { skipMetadata } from '../../utils/post'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'



export default (props) => {
  const { title, contents } = props
  const io = useSelector(state => state.post.io)


  return (
    <>
      <h1 className='title'>{title}</h1>
      <Markdown
        rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeSlug]}
        className='contents'
        components={{
          code(props) {
            const { children, className, node, ...rest } = props
            const match = /^hljs\s/.test(className)
            return (
              <code {...rest} className={match ? className : 'hljs'}>
                {children}
              </code>
            )
          },
        }}
      >
        {skipMetadata(contents)}
      </Markdown>
    </>
  )
}
