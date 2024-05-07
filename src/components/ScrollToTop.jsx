import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default (props) => {
  const pathName = useLocation()
  useEffect(() => {
    scrollTo(window, {
      duration: .3,
      scrollTo: {
        y: 0,
      },
    })
  }, [pathName])
  return <></>
}
