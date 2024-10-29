import { useLoaderData } from 'react-router-typesafe'
import AsyncBlock from '../components/AsyncBlock'
import { useEffect, useState } from 'react'
import Markdown from '../components/Markdown'
import { Link } from 'react-router-dom'
import { SnippetsLoader } from '../fetch'

interface SnippetCardProps {
  snippet: Article
}

const SnippetCard = (props: SnippetCardProps) => {
  const { snippet: fetchedSnippet } = props
  const [snippet, setSnippet] = useState<Article>(fetchedSnippet)

  useEffect(() => {
    if (fetchedSnippet) {
      fetchedSnippet.fetchContents((fetched: Article) => {
        setSnippet((prev: Article) => {
          return { ...prev, ...fetched }
        })
      }, true)
    }
  }, [fetchedSnippet])

  return (
    <li key={snippet.path} className='snippets-card'>
      <Link to={`${snippet.path}`}>
        <h3 className='snippets-card__title'>{snippet.title}</h3>
      </Link>
      <article className='snippets-card__preview'>
        <Markdown text={snippet.contentsWithoutHeader} />
      </article>
    </li>
  )
}

const Snippets = () => {
  const data = useLoaderData<typeof SnippetsLoader>()

  return (
    <AsyncBlock resolve={data.snippets}>
      {(fetched: Article[]) => {
        const snippets = fetched.map((s: Article) => {
          return <SnippetCard key={s.path} snippet={s} />
        })

        return <ul className='snippets'>{snippets}</ul>
      }}
    </AsyncBlock>
  )
}

export default Snippets
