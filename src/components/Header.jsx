import { Link } from 'react-router-dom'
import avatarImg from '../assets/avatar.png'
import githubImg from '../assets/profiles/github.svg'
import linkedinImg from '../assets/profiles/linkedin.svg'
import codepenImg from '../assets/profiles/codepen.png'
import snippetImg from '../assets/snippet.png'

import Icon from './UI/Icon'
import ImageIcon from './UI/ImageIcon'
import { useState } from 'react'
export default (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuToggleHandler = () => {
    setIsMenuOpen((prev) => !prev)
  }

  return (
    <header className={`main-header ${isMenuOpen ? '--opened' : ''}`}>
      <div className='main-header__contents inner'>
        <Link to={import.meta.env.BASE_URL}>
          <img src={avatarImg} alt='avatar of this blog' />
          <h1>Codeleeks</h1>
        </Link>
        <ul className='menu'>
          <li key='github'>
            <ImageIcon
              src={githubImg}
              alt='github icon'
              href='https://github.com/codeleeks/blog'
            >
              <span className='menu__items__text'>Github</span>
            </ImageIcon>
          </li>
          <li key='linkedin'>
            <ImageIcon
              src={linkedinImg}
              alt='linkedin icon'
              href='https://www.linkedin.com/in/kasong-lee-17533b149'
            >
              <span className='menu__items__text'>LinkedIn</span>
            </ImageIcon>
          </li>
          <li key='codepen'>
            <ImageIcon
              src={codepenImg}
              alt='codepen icon'
              href='https://codepen.io/kasong-lee'
            >
              <span className='menu__items__text'>Codepen</span>
            </ImageIcon>
          </li>
          <li key='snippet'>
            <ImageIcon
              src={snippetImg}
              alt='snippet icon'
              href='snippet'
              isLocalRoute
            >
              <span className='menu__items__text'>Code Snippet</span>
            </ImageIcon>
          </li>
        </ul>
        <div className='menu-toggler' onClick={menuToggleHandler}>
          <div className='menu-toggler__icons'>
            <Icon className='menu--open'>menu</Icon>
            <Icon className='menu--close'>close</Icon>
          </div>
          <span>메뉴</span>
        </div>
      </div>
    </header>
  )
}
