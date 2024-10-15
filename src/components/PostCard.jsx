import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const PostCard = (props) => {
  const { post: fetched } = props
  const [post, setPost] = useState(fetched)
  // const navigate = useNavigate()
  useEffect(() => {
    fetched.fetchContents((fetchedPost) => {
      setPost((prev) => {
        return { ...prev, ...fetchedPost }
      })
    })
  }, [fetched])

  // const navigator = () => {
  //   const { title, date,  titleImage } = post
  //   const cloned = { title, date,  titleImage }
  //   navigate(`posts/${post.path}`, { state: { post: cloned } })
  // }

  return (
    <Link to={`posts/${post.path}`}>
      <li className='posts-card' key={post.path}>
        <img
          className='posts-card__image'
          src={post.titleImage}
          alt='title image'
        />
        <h4 className='posts-card__title'>{post.title}</h4>
        <div className='posts-card__date'>
          <div className='posts-card__date__icon material-icons'>alarm</div>
          <p className='posts-card__date__text'>{post.date || ''}</p>
        </div>
        <p className='posts-card__summary'>{post.summary || ''}</p>
      </li>
    </Link>
  )
}

export default PostCard
