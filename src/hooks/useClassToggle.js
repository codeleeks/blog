import { useEffect, useState } from 'react'
import { throttle } from 'lodash'

export function useClassToggle(className) {
  const [isOpen, setIsOpen] = useState()

  useEffect(() => {
    const handler = throttle(() => {
      setIsOpen(false)
      document.body.classList.remove(className)
    })

    window.addEventListener('resize', handler)

    return () => {
      window.removeEventListener('resize', handler)
    }
  }, [])

  const toggleHandler = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen)
    document.body.classList.toggle(className)
  }

  const closeHandler = () => {
    setIsOpen(false)
    document.body.classList.remove(className)
  }

  return {
    isOpen,
    toggleHandler,
    closeHandler
  }
}
