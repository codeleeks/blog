import { Suspense } from 'react'
import { fetchRepositoryPosts } from '../utils/github'
import { Await, defer, useLoaderData } from 'react-router-dom'
import LoadingIndicator from '../components/UI/LoadingIndicator'
import Posts from '../components/Prologue/Posts'
import AsyncError from './AsyncError'

export default function ProloguePage(props) {
  const { posts } = useLoaderData()
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
  const fetchedPosts = await fetchRepositoryPosts()
  return fetchedPosts
}

export async function loader() {
  return defer({ posts: fetchPosts() })
}
