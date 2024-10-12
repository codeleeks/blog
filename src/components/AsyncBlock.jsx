import { Suspense } from "react"
import { Await } from "react-router"

const LoadingIndicator = (props) => {
  return <div className='loading-indicator'>loading...</div>
}

const AsyncBlock = (props) => {
  const {resolve, children} = props
  return <Suspense fallback={<LoadingIndicator />}>
    <Await resolve={resolve}>
      {children}
    </Await>
  </Suspense>
}

export default AsyncBlock