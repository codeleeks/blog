import { useEffect, useState } from 'react'
import { throttle } from 'lodash'
import Icon from '../UI/Icon'

export default (props) => {
  const { children } = props
  const [isOpen, setIsOpen] = useState()

  useEffect(() => {
    const handler = throttle(() => {
      setIsOpen(false)
      document.body.classList.remove('nav--open')
    })

    window.addEventListener('resize', handler)

    return () => {
      window.removeEventListener('resize', handler)
    }
  }, [])

  const toggleHandler = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen)
    document.body.classList.toggle('toc--open')
  }

  const closeHandler = () => {
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
