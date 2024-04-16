import PreviewPost from "./PreviewPost"

export default (props) => {
  const { posts } = props

  return (
    <div className='posts'>
      {posts.map((post) => {
        return <PreviewPost key={post.path} post={post} />
      })}
    </div>
  )
}
