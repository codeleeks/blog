const Search = (props) => {
  const { searchInputProps, onSubmitHandler, onChangeHandler } = props
  return (
    <form className='search' onSubmit={onSubmitHandler}>
      <div className='search__input'>
        <label htmlFor='search__input'></label>
        <input
          type='search'
          id='search__input'
          name='searchTerm'
          autoComplete='off'
          onChange={onChangeHandler}
          {...searchInputProps}
        />
      </div>
      <div className='search__button'>
        <button>검색</button>
      </div>
    </form>
  )
}

export default Search
