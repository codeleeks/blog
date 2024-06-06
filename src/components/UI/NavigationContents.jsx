import NavigationItem from './NavigationItem'

export default (props) => {
  const { articles, basePath } = props
  return (
    <div className='nav__contents'>
      {Object.entries(articles).map(([category, articles]) => {
        return (
          <NavigationItem
            key={category}
            category={category}
            articles={articles}
            basePath={basePath}
          />
        )
      })}
    </div>
  )
}
