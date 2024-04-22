import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeRaw from 'rehype-raw'
import { skipMetadata } from '../../utils/post'

export default (props) => {
  const { title, contents } = props

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
