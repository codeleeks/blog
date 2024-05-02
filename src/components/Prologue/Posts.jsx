import { Link } from 'react-router-dom'
import PreviewPosts from '../PreviewPosts'
import Hero from './Hero'

export default (props) => {
  const { posts } = props

  return (
    <section className='prologue-posts inner'>
      <Hero />
      <PreviewPosts posts={posts} />
    </section>
  )
}
