import TableOfContentsContents from '../UI/Article/TableOfContentsContents'
import { snippetTocObserver } from '../../utils/toc'

const getHeadingItemEls = () => {
  return Array.from(
    document.querySelector('.article-page').querySelectorAll('aside ul li')
  )
}

const SnippetTableOfContents = (props) => {
  const { contents } = props

  return (
    <TableOfContentsContents
      contents={contents}
      getHeadingItemEls={getHeadingItemEls}
      tocObserver={snippetTocObserver}
    />
  )
}

export default SnippetTableOfContents
