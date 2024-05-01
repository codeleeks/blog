export default (props) => {
  const { src, alt, href, children, ...rest } = props
  return (
    <a href={href} className='image-icon' target='_blank' {...rest}>
      <img src={src} alt={alt} />
      {children}
    </a>
  )
}
