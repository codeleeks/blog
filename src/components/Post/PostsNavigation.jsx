import { useState } from 'react'
import Icon from '../UI/Icon'

export default (props) => {
  const { children } = props
  const [isOpen, setIsOpen] = useState(false)

  const navToggleHandler = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen)
    document.body.classList.toggle('nav--open')
  }

  const navCloseHandler = (e) => {
    setIsOpen(false)
    document.body.classList.remove('nav--open')
  }

  return (
    <nav className={isOpen ? 'nav--open' : ''}>
      <div className='nav__scroll-area'>
        <div className='nav__contents-area'>{children}</div>
      </div>
      <div className='nav-toggler' onClick={navToggleHandler}>
        <Icon>menu</Icon>
      </div>
      <div className='nav-bg' onClick={navCloseHandler}></div>
    </nav>
  )
}
