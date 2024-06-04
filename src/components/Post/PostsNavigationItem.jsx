import { NavLink } from "react-router-dom"
import { extractTitle } from '../../utils/post'



export default (props) => {
  const {category, posts} = props

  return (
    <div className="nav__contents-item">
      <h5>{category}</h5>
      <ul>
        {posts.map((post) => (
          <li key={post.sha}>
            <NavLink to={`${import.meta.env.BASE_URL}/posts/${post.path}`}>
              {extractTitle(post.path)}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
