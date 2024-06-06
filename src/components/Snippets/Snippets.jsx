import SnippetItem from './SnippetItem'

const Snippets = (props) => {
  const { snippets } = props
  return (
    <ul className='snippets__items'>
      {snippets && snippets.length === 0 && (
        <p>검색 결과가 없습니다. 다른 제목으로 검색해주세요.</p>
      )}
      {snippets.map((snippet) => (
        <SnippetItem key={snippet} snippetPath={snippet} />
      ))}
    </ul>
  )
}

export default Snippets
