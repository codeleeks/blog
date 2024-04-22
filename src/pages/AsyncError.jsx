import { useAsyncError } from 'react-router-dom'
import { decode } from 'html-entities'

export default (props) => {
  const error = useAsyncError()

  let title = 'Fetching Error Occured!'
  let message = 'something went wrong'

  if (error?.message) {
    try {
      message = JSON.parse(error.message).message
    } catch (e) {
      message = error.message
    }
  }

  return (
    <section className='error'>
      <h2>{title}</h2>
      <p>{decode(message)}</p>
    </section>
  )
}
