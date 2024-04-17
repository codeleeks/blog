import { Await, defer, useLoaderData, useParams } from 'react-router-dom'
import Posts from '../components/Posts'
import { fetchRepositoryPosts } from '../utils/github'
import { Suspense } from 'react'
import LoadingIndicator from '../components/UI/LoadingIndicator'
import PreviewPosts from '../components/PreviewPosts'
import { throwErrorJsonIfError } from '../utils/loader-error'
export default function CategoryPostsPage(props) {
  const { posts } = useLoaderData()
  const { category } = useParams()
  return (
    <section className='category-posts'>
      <h2>{category}</h2>
      <Suspense fallback={<LoadingIndicator />}>
        <Await resolve={posts}>
          {(fetchedPosts) => {
            return <PreviewPosts posts={fetchedPosts} />
          }}
        </Await>
      </Suspense>
    </section>
  )
}

async function fetchPosts(category) {
  const allPosts = await fetchRepositoryPosts()
  throwErrorJsonIfError(allPosts)
  return allPosts[category]
}

export async function loader({ params }) {
  return defer({ posts: fetchPosts(params.category) })
}
