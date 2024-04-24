import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeRaw from 'rehype-raw'
import { extractTitleImage, skipMetadata } from '../../utils/post'
import MessageBox from './MessageBox'

export default (props) => {
  const { title, contents } = props
  const titleImg = extractTitleImage(contents)
  return (
    <>
      <h1 className='title'>{title}</h1>
      <img src={titleImg} alt={title} className='title-image' />
      <MessageBox title='Good News!' level='warning'>
        <span>
          The page you requested doesn't exist in Korean but it exists in
          English
        </span>
        <a href='codeleeks.github.io/blog'>Go to my blog~</a>
      </MessageBox>
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
