import { useLoaderData } from 'react-router'
import AsyncBlock from '../components/AsyncBlock'
import { useEffect, useState } from 'react'
import Markdown from '../components/Markdown'
import { Link } from 'react-router-dom'

const SnippetCard = (props) => {
  const { snippet: fetchedSnippet } = props
  const [snippet, setSnippet] = useState(fetchedSnippet)

  useEffect(() => {
    if (fetchedSnippet) {
      fetchedSnippet.fetchContents((fetched) => {
        setSnippet((prev) => {
          return { ...prev, ...fetched }
        })
      }, true)
    }
  }, [fetchedSnippet])

  return (
    <Link to={`${snippet.path}`}>
      <li key={snippet.path} className='snippets-card'>
        <h3 className='snippets-card__title'>{snippet.title}</h3>
        <article className='snippets-card__preview'>
          <Markdown text={snippet.contentsWithoutHeader} />
        </article>
      </li>
    </Link>
  )
}

const Snippets = (props) => {
  const data = useLoaderData()

  return (
    <AsyncBlock resolve={data.snippets}>
      {(fetched) => {
        const snippets = fetched.map((s) => {
          return <SnippetCard key={s.path} snippet={s} />
        })

        return <ul className='snippets'>{snippets}</ul>
      }}
    </AsyncBlock>
  )
}

export default Snippets
