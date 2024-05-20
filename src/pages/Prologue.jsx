import { Suspense } from 'react'
import { fetchRepositoryPosts } from '../utils/github'
import { Await, defer, useLoaderData } from 'react-router-dom'
import LoadingIndicator from '../components/UI/LoadingIndicator'
import Posts from '../components/Prologue/Posts'
import AsyncError from './AsyncError'
import { queryClient } from '../utils/react-query'
import { useQuery } from '@tanstack/react-query'

export default function ProloguePage(props) {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchRepositoryPosts,
  })

  const posts = Promise.resolve(data)

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Await resolve={posts} errorElement={<AsyncError />}>
        {(fetchedPosts) => {
          const allPosts = Object.values(fetchedPosts).flatMap((category) => [
            ...category,
          ])
          return <Posts posts={allPosts} />
        }}
      </Await>
    </Suspense>
  )
}

async function fetchPosts() {
  return queryClient.fetchQuery({
    queryKey: ['posts'],
    queryFn: fetchRepositoryPosts,
  })
}

export function loader() {
  return defer({
    data: fetchPosts(),
  })
}