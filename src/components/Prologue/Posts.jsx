import { Link } from 'react-router-dom'
import PreviewPosts from '../PreviewPosts'

export default (props) => {
  const { posts } = props

  return (
    <section className={`prologue-posts`}>
      <PreviewPosts posts={posts} />
    </section>
  )
}
