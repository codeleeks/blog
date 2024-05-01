import { useState } from 'react'
import Icon from '../UI/Icon'

export default (props) => {
  const { children } = props
  const [isOpen, setIsOpen] = useState()

  const toggleHandler = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen)
    document.body.classList.toggle('toc--open')
  }

  const closeHandler = () => {
    console.log('clicked')
    setIsOpen(false)
    document.body.classList.remove('toc--open')
  }

  return (
    <aside className={isOpen ? 'toc--open' : ''}>
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
