export default (props) => {
  const {title, level, children} = props
  return (
    <div className={`message-box ${level}`}>
      <h6 className='message-title'>{title}</h6>
      <div className='message-contents'>{children}</div>
    </div>
  )
}
