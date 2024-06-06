import { useQuery } from '@tanstack/react-query'
import { fetchRepositoryCodeSnippetsFileContents } from '../../utils/github'
import Card from '../UI/Card'
import { Link } from 'react-router-dom'
import { extractDate, extractSummary, extractTitle } from '../../utils/post'

const SnippetItem = (props) => {
  const { snippetPath } = props
  const { data: contents } = useQuery({
    queryKey: ['snippets', snippetPath],
    queryFn: () =>
      fetchRepositoryCodeSnippetsFileContents({ path: snippetPath }),
  })

  const title = extractTitle(snippetPath)
  const date = extractDate(contents)
  const summary = extractSummary(contents)

  return (
    <li>
      <Link to={snippetPath} key={snippetPath}>
        <Card hasImage={false} title={title} date={date}>
          {contents}
        </Card>
      </Link>
    </li>
  )
}

export default SnippetItem
