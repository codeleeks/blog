import AsyncBlock from '../AsyncBlock'
import Navigation from './Navigation'
import TableOfContents from './TableOfContents'

const Article = (props) => {
  const { NavigationComponent, ArticleComponent, TableOfContentsComponent } =
    props

  return (
    <section className='article-page inner'>
      <Navigation>{NavigationComponent}</Navigation>
      <section className='article'>{ArticleComponent}</section>
      <TableOfContents>{TableOfContentsComponent}</TableOfContents>
    </section>
  )
}

export default Article
