import Icon from '../UI/Icon'
import { useClassToggle } from '../../hooks/useClassToggle.js'

export default (props) => {
  const { children } = props
  const className = 'toc--open'
  const { isOpen, toggleHandler, closeHandler } = useClassToggle(className)

  return (
    <aside className={isOpen ? className : ''}>
      <div className='toc-bg' onClick={closeHandler}></div>
      <div className='toc-toggler' onClick={toggleHandler}>
        <Icon>segment</Icon>
      </div>
      <div className='toc__scroll-area'>
        <div className='toc__contents-area'>{children}</div>
      </div>
    </aside>
  )
}
