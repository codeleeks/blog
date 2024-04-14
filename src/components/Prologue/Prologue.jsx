import { useEffect, useState } from 'react'
import { fetchRepositoryPosts } from '../../utils/github'
import Card from '../UI/Card'
import { Link } from 'react-router-dom'

export default (props) => {
  const [posts, setPosts] = useState()
  useEffect(() => {
    async function fetchPosts() {
      const token = import.meta.env.VITE_GITHUB_ACCESS_TOKEN
      const fetchedPosts = await fetchRepositoryPosts(
        token,
        'codeleeks',
        'blog',
        'codeleeks-posts'
      )
      setPosts(fetchedPosts)
    }
    fetchPosts()
  }, [])

  let content = undefined
  if (posts) {
    const categories = Object.keys(posts)
    content = categories.map((category, index) => (
      <section
        key={category}
        className={`posts ${
          index % 2 === 0 ? 'gray' : undefined
        } ${category.toLowerCase()}`}
      >
        <h2 className='header'>{category}</h2>
        <div className='contents'>
          {posts[category].slice(0, 4).map((post) => (
            <Link to={post.path}>
              <Card title={post.path} contents={post.sha} key={post.path} />
            </Link>
          ))}
        </div>
        <Link to={category} className='more-btn'>
          <button>more posts</button>
        </Link>
      </section>
    ))
  }

  return (
    <main>
      {content}
      {/* <section className='posts dom-api'></section>
      <section className='posts libraries'></section>
      <section className='posts vscode'></section> */}
    </main>
  )
}
