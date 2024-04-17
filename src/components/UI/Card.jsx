import Date from './Date'

export default (props) => {
  const { title, date, children } = props

  return (
    <article className='card'>
      <header>
        <h3>{title}</h3>
        <Date dateTime={date} />
      </header>
      <p>{children}</p>
    </article>
  )
}
