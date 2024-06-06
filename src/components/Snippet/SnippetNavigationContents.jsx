import NavigationContents from '../UI/NavigationContents'

const SnippetNavigationContents = (props) => {
  const { snippets } = props
  const basePath = `${import.meta.env.BASE_URL}/snippets`
  return <NavigationContents articles={snippets} basePath={basePath} />
}

export default SnippetNavigationContents
