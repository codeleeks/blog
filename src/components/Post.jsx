import { useLoaderData } from 'react-router'
import { postTocObserver } from '../utils/headingObserver'
import Article from './Article'

const Post = (props) => {
  const data = useLoaderData()

  return <Article loaderData={data} headingObserver={postTocObserver} />
}

export default Post
