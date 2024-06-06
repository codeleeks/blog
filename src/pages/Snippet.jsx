import { defer, useParams } from 'react-router-dom'
import { queryClient } from '../utils/react-query'
import {
  fetchCodeSnippets,
  fetchRepositoryCodeSnippetsFileContents,
} from '../utils/github'
import { useQuery } from '@tanstack/react-query'
import MarkdownView from '../components/UI/MarkdownView'
import AsyncBlock from '../components/AsyncBlock'

const SnippetPage = (props) => {
  const { category, snippetFileName } = useParams()
  const path = `${category}/${snippetFileName}`

  const { data: snippets } = useQuery({
    queryKey: ['snippets'],
    queryFn: fetchCodeSnippets,
  })

  const { data: contents } = useQuery({
    queryKey: ['snippets', path],
    queryFn: ({ queryKey }) =>
      fetchRepositoryCodeSnippetsFileContents({ path: queryKey[1] }),
  })

  console.log(snippets)
  console.log(contents)

  return (
    <section className='snippet inner'>
      <AsyncBlock resolve={Promise.resolve(snippets)}></AsyncBlock>
      <AsyncBlock resolve={Promise.resolve(contents)}>
        {(resolvedContents) => {
          return <MarkdownView text={resolvedContents} />
        }}
      </AsyncBlock>
    </section>
  )
}

export function loader({ params }) {
  const { category, snippetFileName } = params
  const path = `${category}/${snippetFileName}`
  return defer({
    snippets: queryClient.fetchQuery({
      queryKey: ['snippets'],
      queryFn: fetchCodeSnippets,
    }),
    contents: queryClient.fetchQuery({
      queryKey: ['snippets', path],
      queryFn: ({ queryKey }) =>
        fetchRepositoryCodeSnippetsFileContents({ path: queryKey[1] }),
    }),
  })
}

export default SnippetPage
