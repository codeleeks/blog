import Date from './Date'

export default (props) => {
  const { imgSrc, title, date, hasImage = true, children } = props

  return (
    <article className='card'>
      <header>
        {hasImage && <img src={imgSrc} alt={title} />}
        <h3>{title}</h3>
        <Date dateTime={date} />
      </header>
      <p>{children}</p>
    </article>
  )
}
