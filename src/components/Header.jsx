import { Link } from 'react-router-dom'
import avatarImg from '../assets/avatar.png'
import Icon from './UI/Icon'
export default (props) => {
  return (
    <header className='navigation'>
      <Link to={import.meta.env.BASE_URL}>
        <img src={avatarImg} alt='avatar of this blog' />
        <h1>Codeleeks</h1>
      </Link>
      <Icon>search</Icon>
    </header>
  )
}
