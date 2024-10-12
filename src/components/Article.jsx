import { useLoaderData } from 'react-router'
import AsyncBlock from './AsyncBlock'

const Article = (props) => {
  const data = useLoaderData()

  return (
    <AsyncBlock resolve={data.articleContents}>
      {(contents) => {
        return (
          <div className='article'>
            <nav className='article-nav'>
              <div className='article-nav__bg'></div>
              <div className='article-nav__menu'>
                <ul className='article-nav__scroll'>
                  <li>
                    <a href='#'>Home</a>
                  </li>
                </ul>
                <div className='article-nav__toggler'>toggler</div>
              </div>
            </nav>
            <article className='article-article'>{contents}</article>
            <aside className='article-aside'>
              <div className='article-aside__bg'></div>
              <div className='article-aside__menu'>
                <ul className='article-aside__scroll'>
                  <li>
                    <a href='#'>Home</a>
                  </li>
                  <li>
                    <a href='#'>About</a>
                  </li>
                  <li>
                    <a href='#'>Contact</a>
                  </li>
                </ul>
                <div className='article-aside__toggler'>toggler</div>
              </div>
            </aside>
          </div>
        )
      }}
    </AsyncBlock>
  )
}

export default Article
