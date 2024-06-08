import { NavLink } from 'react-router-dom'
import { extractTitle } from '../../../utils/post'

export default (props) => {
  const { category, articles, basePath } = props

  return (
    <div className='nav__contents-item'>
      <h5>{category}</h5>
      <ul>
        {articles.map((article) => (
          <li key={article.path}>
            <NavLink to={`${basePath}/${article.path}`}>
              {extractTitle(article.path)}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
