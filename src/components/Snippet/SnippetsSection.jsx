import { useState } from 'react'
import SnippetSearch from './SnippetSearch'
import Snippets from './Snippets'

function simplify(fetchedSnippets) {
  return Object.values(fetchedSnippets).flatMap((categorySnippets) =>
    categorySnippets.map((s) => s.path)
  )
}

const SnippetsSection = (props) => {
  const snippets = simplify(props.snippets)
  const [filteredSnippets, setFilteredSnippets] = useState(snippets)

  const onSearchHandler = (e) => {
    const searchTerm = e.target.value
    const filteredSnippets = snippets.filter((snippet) =>
      snippet.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSnippets(filteredSnippets)
  }

  const onChangeHandler = (e) => {
    onSearchHandler(e)
  }

  const onSubmitHandler = (e) => {
    onSearchHandler(e)
  }

  return (
    <section className='snippets inner'>
      <SnippetSearch
        onChangeHandler={onChangeHandler}
        onSubmitHandler={onSubmitHandler}
      />
      <Snippets snippets={filteredSnippets} />
    </section>
  )
}

export default SnippetsSection
