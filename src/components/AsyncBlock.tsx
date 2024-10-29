import { Suspense } from 'react'
import { Await, AwaitProps } from 'react-router'

const LoadingIndicator = () => {
  return <div className='loading-indicator'>loading...</div>
}

interface AsyncBlockProps {
  resolve: AwaitProps['resolve']
  children: AwaitProps['children']
}

const AsyncBlock = (props: AsyncBlockProps) => {
  const { resolve, children } = props
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Await resolve={resolve}>{children}</Await>
    </Suspense>
  )
}

export default AsyncBlock
