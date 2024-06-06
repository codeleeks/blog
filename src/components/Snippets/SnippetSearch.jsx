import Search from '../UI/Search'

const SnippetSearch = (props) => {
  const { onSubmitHandler, onChangeHandler } = props
  return (
    <div className='snippets__search'>
      <Search
        searchInputProps={{ placeholder: '제목을 검색하세요.' }}
        onChangeHandler={onChangeHandler}
        onSubmitHandler={onSubmitHandler}
      />
    </div>
  )
}

export default SnippetSearch
