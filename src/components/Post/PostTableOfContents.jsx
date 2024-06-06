import TableOfContentsContents from '../UI/TableOfContentsContents'
import { postTocObserver } from '../../utils/toc'

const getHeadingItemEls = () => {
  return Array.from(
    document.querySelector('.article-page').querySelectorAll('aside ul li')
  )
}

const PostTableOfContents = (props) => {
  const { contents } = props

  return (
    <TableOfContentsContents
      contents={contents}
      getHeadingItemEls={getHeadingItemEls}
      tocObserver={postTocObserver}
    />
  )
}

export default PostTableOfContents
