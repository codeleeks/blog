import { useEffect, useState } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { decode } from 'html-entities'

export default function ErrorPage() {
  const error = useRouteError()
  let title = 'Error occurred!'
  let message = 'something went wrong'

  console.log(error)
  console.log(JSON.parse(error.message))
  console.log(isRouteErrorResponse(error))

  if (error.status === 404) {
    title = 'Not found!'
    message = 'Could not find resource or page.'
  }
  if (isRouteErrorResponse(error) && error.status === 500) {
    message = error.data.message
  }
  return (
    <section className='error'>
      <h2>{title}</h2>
      <p>{decode(message)}</p>
    </section>
  )
}
