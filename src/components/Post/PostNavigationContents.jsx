import NavigationContents from "../UI/NavigationContents"

const PostNavigationContents = (props) => {
  const {posts} = props
  const basePath = `${import.meta.env.BASE_URL}/posts`
  return <NavigationContents articles={posts} basePath={basePath}/>
}

export default PostNavigationContents
