import { useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError()
  let title = 'Error occurred!'
  let message = 'something went wrong'

  if (error.status === 500) {
    message = error.message
  }
  if (error.status === 404) {
    title = 'could not fetch page or resource'
    message = ''
  }

  return (
    <section className='error'>
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  )
}
