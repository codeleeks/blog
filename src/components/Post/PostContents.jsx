import { extractTitleImage, skipMetadata } from '../../utils/post'
import { postTocObserver } from '../../utils/toc'
import ArticleContents from '../UI/ArticleContents'
export default (props) => {
  const { title, contents } = props
  const titleImg = extractTitleImage(contents)
  const skipped = skipMetadata(contents)
  return (
    <ArticleContents
      title={title}
      titleImg={titleImg}
      contents={skipped}
      tocObserver={postTocObserver}
    />
  )
}
