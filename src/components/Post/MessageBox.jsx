import Icon from '../UI/Icon'

export default (props) => {
  const {title, level, children} = props
  return (
    <div className={`message-box ${level}`}>
      <h5>{title}</h5>
      <p>
        {children}
      </p>
    </div>
  )
}