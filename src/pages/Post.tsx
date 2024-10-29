import { useLoaderData } from 'react-router'
import { postTocObserver } from '../utils/headingObserver'
import Article from '../components/Article'
import { postEditBaseUrl } from '../fetch'

const Post = () => {
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
