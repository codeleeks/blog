import { Suspense } from 'react'
import { fetchRepositoryPosts } from '../utils/github'
import { Await, defer, json, useLoaderData } from 'react-router-dom'
import LoadingIndicator from '../components/UI/LoadingIndicator'
import Posts from '../components/Prologue/Posts'
import { throwErrorJsonIfError } from '../utils/loader-error'

export default function ProloguePage(props) {
  const { posts } = useLoaderData()
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Await resolve={posts}>
        {(fetchedPosts) => {
          const categories = Object.keys(fetchedPosts)
          return (
            <main>
              {categories.map((category, index) => {
                return (
                  <Posts
                    category={category}
                    isGray={index % 2 === 0}
                    posts={fetchedPosts[category].slice(0, 4)}
                  />
                )
              })}
            </main>
          )
        }}
      </Await>
    </Suspense>
  )
}

async function fetchPosts() {
  const fetchedPosts = await fetchRepositoryPosts()
  throwErrorJsonIfError(fetchedPosts)
  return fetchedPosts
}

export async function loader() {
  return defer({ posts: fetchPosts() })
}
