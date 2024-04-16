import { Link } from 'react-router-dom'
import PreviewPosts from '../PreviewPosts'

export default (props) => {
  const { category, isGray, posts } = props

  return (
    <section
      key={category}
      className={`prologue-posts ${
        isGray ? 'gray' : undefined
      } ${category.toLowerCase()}`}
    >
      <h2 className='header'>{category}</h2>
      <PreviewPosts posts={posts} />
      <Link to={category} className='more-btn'>
        <button>more posts</button>
      </Link>
    </section>
  )
}
