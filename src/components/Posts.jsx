import Post from './Post'

export default (props) => {
  const { posts } = props

  return (
    <div className='posts'>
      {posts.map((post) => {
        return <Post key={post.path} post={post} />
      })}
    </div>
  )
}
