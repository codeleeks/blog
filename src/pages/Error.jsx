import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import ErrorBlock from '../components/UI/ErrorBlock'

export default function ErrorPage() {
  const error = useRouteError()
  let title = 'Error occurred!'
  let message = 'something went wrong'

  if (error.status === 404) {
    title = 'Not found!'
    message = 'Could not find resource or page.'
  }
  if (isRouteErrorResponse(error) && error.status === 500) {
    message = error.data.message
  }
  return <ErrorBlock title={title} message={message} />
}
