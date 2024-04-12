import Date from '../UI/Date'

export default (props) => {
  const { post } = props
  const { image, title, date } = post

  return (
    <figure className='post-item'>
      <div className='image'>
        <img src={image} alt={title} />
      </div>
      <figcaption className='text'>
        <h5>{title}</h5>
        <Date dateTime={date} />
      </figcaption>
    </figure>
  )
}
