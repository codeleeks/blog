import { snippetTocObserver } from '../../utils/toc'
import ArticleContents from '../UI/Article/ArticleContents'
export default (props) => {
  const { title, contents } = props
  return (
    <ArticleContents
      title={title}
      contents={contents}
      tocObserver={snippetTocObserver}
    />
  )
}
