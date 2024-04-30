export default (props) => {
  const {className, children} = props
  return <span className={`icon material-icons ${className ?? ''}`}>{children}</span>
}
