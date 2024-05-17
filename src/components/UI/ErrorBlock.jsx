import { decode } from 'html-entities'

export default (props) => {
  const { title, message } = props

  return (
    <section className='error'>
      <h2>{title}</h2>
      <p>{decode(message)}</p>
    </section>
  )
}
