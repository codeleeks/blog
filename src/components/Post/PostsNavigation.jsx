import Icon from '../UI/Icon'
import {useClassToggle} from '../../hooks/useClassToggle'

export default (props) => {
  const { children } = props
  const className = 'nav--open'
  const {isOpen, toggleHandler, closeHandler} = useClassToggle(className)

  return (
    <nav className={isOpen ? className : ''}>
      <div className='nav-bg' onClick={closeHandler}></div>
      <div className='nav__scroll-area'>
        <div className='nav__contents-area'>{children}</div>
      </div>
      <div className='nav-toggler' onClick={toggleHandler}>
        <Icon>menu</Icon>
      </div>
    </nav>
  )
}
