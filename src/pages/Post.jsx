import { useLoaderData } from 'react-router'
import { postTocObserver } from '../utils/headingObserver'
import Article from '../components/Article'
import { postEditBaseUrl } from '../fetch'

const Post = (props) => {
  const data = useLoaderData()

  return (
    <Article
      editBaseUrl={postEditBaseUrl}
      loaderData={data}
      headingObserver={postTocObserver}
    />
  )
}

export default Post
