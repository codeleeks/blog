import { Link } from 'react-router-dom'

export default (props) => {
  const { src, alt, href, children, isLocalRoute = false, ...rest } = props

  let Content = (
    <a href={href} className='image-icon' target='_blank' {...rest}>
      <img src={src} alt={alt} />
      {children}
    </a>
  )

  if (isLocalRoute) {
    Content = (
      <Link to={href} className='image-icon'>
        <img src={src} alt={alt} />
        {children}
      </Link>
    )
  }

  return Content
}
