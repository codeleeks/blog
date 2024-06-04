import { decode } from 'html-entities'
import { Link } from 'react-router-dom'

export default (props) => {
  const { title, message } = props

  return (
    <section className='error'>
      <h2>{title}</h2>
      <p>{decode(message)}</p>
      <Link to='/blog' replace className='homelink'>
        Home으로 가기
      </Link>
    </section>
  )
}
