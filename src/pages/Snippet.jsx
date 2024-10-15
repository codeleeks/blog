import { useLoaderData } from 'react-router'
import { postTocObserver, snippetTocObserver } from '../utils/headingObserver'
import Article from '../components/Article'
import { snippetEditBaseUrl } from '../fetch'

const Snippet = (props) => {
  const data = useLoaderData()
  return (
    <Article
      editBaseUrl={snippetEditBaseUrl}
      loaderData={data}
      headingObserver={postTocObserver}
    />
  )
}

export default Snippet
