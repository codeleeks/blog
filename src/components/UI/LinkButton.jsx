import { Children } from "react"
import { Link } from "react-router-dom"

export default props => {
  const {to, children, className = ''} = props
  return <Link to={to} className={className}>
    <button>{children}</button>
  </Link>
}