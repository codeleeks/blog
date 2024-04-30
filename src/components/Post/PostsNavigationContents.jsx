import { useAsyncValue } from 'react-router-dom'
import PostsNavigationItem from './PostsNavigationItem'

export default (props) => {
  const fetchedPosts = useAsyncValue()
  return (
    <div className='nav__contents'>
      {Object.entries(fetchedPosts).map(([category, posts]) => {
        return (
          <PostsNavigationItem key={category} category={category} posts={posts} />
        )
      })}
    </div>
  )
}
