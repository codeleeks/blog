import { Suspense } from 'react'
import AsyncError from '../pages/AsyncError'
import LoadingIndicator from './UI/LoadingIndicator'
import { Await } from 'react-router-dom'

export default (props) => {
  const { resolve, children } = props

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Await resolve={resolve} errorElement={<AsyncError />}>
        {children}
      </Await>
    </Suspense>
  )
}
