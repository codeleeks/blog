import { defer, useParams } from 'react-router-dom'
import { queryClient } from '../utils/react-query'
import {
  fetchCodeSnippets,
  fetchRepositoryCodeSnippetsFileContents,
} from '../utils/github'
import { useQuery } from '@tanstack/react-query'
import MarkdownView from '../components/UI/MarkdownView'
import AsyncBlock from '../components/AsyncBlock'
import { extractTitle } from '../utils/post'
import SnippetNavigationContents from '../components/Snippet/SnippetNavigationContents'
import Article from '../components/UI/Article'
import SnippetContents from '../components/Snippet/SnippetContents'
import SnippetTableOfContents from '../components/Snippet/SnippetTableOfContents'

const SnippetPage = (props) => {
  const { category, snippetFileName } = useParams()
  const path = `${category}/${snippetFileName}`

  const { data: snippetsData } = useQuery({
    queryKey: ['snippets'],
    queryFn: fetchCodeSnippets,
  })

  const { data: contentsData } = useQuery({
    queryKey: ['snippets', path],
    queryFn: ({ queryKey }) =>
      fetchRepositoryCodeSnippetsFileContents({ path: queryKey[1] }),
  })

  const snippets = Promise.resolve(snippetsData)
  const contents = Promise.resolve(contentsData)

  const title = extractTitle(path)

  const NavigationComponent = (
    <AsyncBlock resolve={snippets}>
      {(fetchedSnippets) => {
        return <SnippetNavigationContents snippets={fetchedSnippets} />
      }}
    </AsyncBlock>
  )

  const ArticleComponent = (
    <AsyncBlock resolve={contents}>
      {(fetchedContents) => {
        return <SnippetContents title={title} contents={fetchedContents} />
      }}
    </AsyncBlock>
  )

  const TableOfContentsComponent = (
    <AsyncBlock resolve={contents}>
      {(fetchedContents) => {
        return <SnippetTableOfContents contents={fetchedContents} />
      }}
    </AsyncBlock>
  )

  return (
    // <section className='snippet inner'>
    //   <AsyncBlock resolve={Promise.resolve(snippets)}></AsyncBlock>
    //   <AsyncBlock resolve={Promise.resolve(contents)}>
    //     {(resolvedContents) => {
    //       return <MarkdownView text={resolvedContents} />
    //     }}
    //   </AsyncBlock>
    // </section>
    <Article
      NavigationComponent={NavigationComponent}
      ArticleComponent={ArticleComponent}
      TableOfContentsComponent={TableOfContentsComponent}
    />
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
