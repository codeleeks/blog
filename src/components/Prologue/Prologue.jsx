import { Suspense } from 'react'
import { fetchRepositoryPosts } from '../../utils/github'
import Card from '../UI/Card'
import { Await, Link, defer, json, useLoaderData } from 'react-router-dom'
import LoadingIndicator from '../UI/LoadingIndicator'

export default (props) => {
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
                  <section
                    key={category}
                    className={`posts ${
                      index % 2 === 0 ? 'gray' : undefined
                    } ${category.toLowerCase()}`}
                  >
                    <h2 className='header'>{category}</h2>
                    <div className='contents'>
                      {fetchedPosts[category].slice(0, 4).map((post) => (
                        <Link to={post.path} key={post.path}>
                          <Card title={post.path} contents={post.sha} />
                        </Link>
                      ))}
                    </div>
                    <Link to={category} className='more-btn'>
                      <button>more posts</button>
                    </Link>
                  </section>
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
  const token = import.meta.env.VITE_GITHUB_ACCESS_TOKEN
  const fetchedPosts = await fetchRepositoryPosts(
    token,
    'codeleeks',
    'blog',
    'codeleeks-posts'
  )
  if (fetchedPosts?.isError) {
    throw json(
      {
        message: fetchedPosts.message,
      },
      {
        status: fetchedPosts.status,
      }
    )
  }

  return fetchedPosts
}

export async function loader() {
  return defer({ posts: fetchPosts() })
}
