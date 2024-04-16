import { Await, defer, useLoaderData, useParams } from 'react-router-dom'
import Posts from '../components/Posts'
import { fetchRepositoryPosts } from '../utils/github'
import { Suspense } from 'react'
import LoadingIndicator from '../components/UI/LoadingIndicator'
import PreviewPosts from '../components/PreviewPosts'
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
  if (allPosts?.isError) {
    throw json(
      {
        message: allPosts.message,
      },
      {
        status: allPosts.status,
      }
    )
  }

  return allPosts[category]
}

export async function loader({ params }) {
  return defer({ posts: fetchPosts(params.category) })
}
