import { useEffect, useState } from 'react'
import { useRouteError } from 'react-router-dom'
import { decode } from 'html-entities'

export default function ErrorPage() {
  const error = useRouteError()
  let title = 'Error occurred!'

  const [message, setMessage] = useState('something went wrong')
  useEffect(() => {
    async function handleError() {
      if (error?.json) {
        const message = await error.json()
        setMessage(decode(message))
      }
    }

    handleError()
  }, [error])

  if (error.status === 404) {
    title = 'could not fetch page or resource'
  }

  return (
    <section className='error'>
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  )
}
