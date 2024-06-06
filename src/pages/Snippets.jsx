import { defer } from 'react-router-dom'
import SnippetsSection from '../components/Snippets/SnippetsSection'
import { fetchCodeSnippets } from '../utils/github'
import AsyncBlock from '../components/AsyncBlock'
import { queryClient } from '../utils/react-query'
import { useQuery } from '@tanstack/react-query'

const SnippetsPage = (props) => {
  const { data } = useQuery({
    queryKey: ['snippets'],
    queryFn: fetchCodeSnippets,
  })
  const snippets = Promise.resolve(data)
  return (
    <AsyncBlock resolve={snippets}>
      {(fetchedSnippets) => {
        return <SnippetsSection snippets={fetchedSnippets} />
      }}
    </AsyncBlock>
  )
}

export function loader() {
  return defer({
    snippets: queryClient.fetchQuery({
      queryKey: ['snippets'],
      queryFn: fetchCodeSnippets,
    }),
  })
}

export default SnippetsPage
