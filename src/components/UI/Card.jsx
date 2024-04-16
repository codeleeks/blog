import Date from './Date'

export default (props) => {
  const { title, children } = props

  return (
    <article className='card'>
      <header>
        <h3>{title}</h3>
        <Date dateTime='2024-04-14' />
      </header>
      <p>{children}</p>
    </article>
  )
}
