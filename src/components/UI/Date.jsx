import Icon from "./Icon"

export default (props) => {
  const { dateTime } = props
  const date = new Date(dateTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className='date'>
      <Icon>alarm</Icon>
      <time dateTime={date}>{date}</time>
    </div>
  )
}
