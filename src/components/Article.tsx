import { useRef } from 'react'
import AsyncBlock from './AsyncBlock'
import { gsap } from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import { NavLink } from 'react-router-dom'
import Markdown from './Markdown'
import { HeadingObserver, TableOfContents } from '../utils/headingObserver'

gsap.registerPlugin(ScrollToPlugin)

interface TocItemProps {
  headings: TableOfContents[]
}

const TocItem = (props: TocItemProps) => {
  const { headings } = props
  const timer = useRef<NodeJS.Timeout>()
  let headingSlug: string

  const scroller = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    const anchorEl = e.target as HTMLAnchorElement
    const slug = anchorEl.attributes.getNamedItem('href').value

    gsap.to(window, {
      duration: 1,
      scrollTo: {
        y: slug,
        offsetY: 120,
      },
    })

    if (timer.current) {
      clearTimeout(timer.current)
    }

    if (headingSlug) {
      const headingEl = document.querySelector(headingSlug)
      headingEl.classList.remove('active')
    }

    headingSlug = slug

    const headingEl = document.querySelector(slug)
    headingEl.classList.add('active')

    timer.current = setTimeout(() => {
      headingEl.classList.remove('active')
    }, 3000)
  }

  const items = headings.map((heading) => {
    const { level, slug, text } = heading
    return (
      <li key={slug} className={`article-aside__scroll__heading-${level}`}>
        <a href={`#${slug}`} onClick={scroller}>
          {text.replaceAll('`', '')}
        </a>
      </li>
    )
  })

  return <>{items}</>
}

interface ArticleProps {
  editBaseUrl: string
  loaderData: any
  headingObserver: HeadingObserver
}

const Article = (props: ArticleProps) => {
  const { editBaseUrl, loaderData: data, headingObserver } = props
  const contentsRef = useRef(null)
  const tocRef = useRef(null)
  const navRef = useRef(null)
  const asideRef = useRef(null)

  const startHeadingObserver = (contents: string) => {
    if (contentsRef.current.childNodes) {
      if (tocRef.current.childNodes) {
        headingObserver.clear()
        const tocHeadingEls = Array.from(
          tocRef.current.childNodes
        ) as HTMLElement[]
        headingObserver.register(tocHeadingEls, contents)
        const contentsHeadingEls = Array.from(
          contentsRef.current.childNodes as HTMLHeadingElement[]
        ).filter((node) => node.nodeName.match(/h[1-6]/i))
        headingObserver.start(contentsHeadingEls)
      }
    }
  }

  const toggler = (e: React.MouseEvent, ref: React.MutableRefObject<any>) => {
    e.stopPropagation()
    ref.current.classList.toggle('toggled')
    document.body.classList.toggle('toggled')
  }

  const closer = (e: React.MouseEvent, ref: React.MutableRefObject<any>) => {
    ref.current.classList.remove('toggled')
    document.body.classList.remove('toggled')
  }

  return (
    <>
      <div className='article'>
        <nav className='article-nav' ref={navRef}>
          <div
            className='article-nav__bg'
            onClick={(e) => {
              closer(e, navRef)
            }}
          ></div>
          <div className='article-nav__menu'>
            <ul className='article-nav__scroll'>
              <AsyncBlock resolve={data.articles}>
                {(fetchedArticles: Article[]) => {
                  const articlesPerCategory = fetchedArticles.reduce(
                    (acc: { [c: string]: Article[] }, cur: Article) => {
                      const { category } = cur
                      if (category in acc) {
                        acc[category].push(cur)
                      } else {
                        acc[category] = [cur]
                      }

                      return acc
                    },
                    {}
                  )

                  let items = []
                  for (const category in articlesPerCategory) {
                    const articles = articlesPerCategory[category]

                    items.push(
                      <li
                        key={category}
                        className='article-nav__scroll__nav-item'
                      >
                        <h4 className='article-nav__scroll__nav-item__category'>
                          {category}
                        </h4>
                        <ul className='article-nav__scroll__nav-item__articles'>
                          {articles.map((article: Article) => (
                            <li
                              className='article-nav__scroll__nav-item__articles__item'
                              key={article.path}
                            >
                              <NavLink
                                to={`${article.path}`}
                                onClick={(e) => closer(e, navRef)}
                              >
                                {article.title}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  }

                  return <>{items}</>
                }}
              </AsyncBlock>
            </ul>
            <div
              className='article-nav__toggler material-icons'
              onClick={(e) => {
                toggler(e, navRef)
              }}
            >
              menu
            </div>
          </div>
        </nav>
        <article className='article-article'>
          <AsyncBlock resolve={data.contents}>
            {(fetched: Article) => {
              const { title, titleImage, date, contentsWithoutHeader, path } =
                fetched
              return (
                <>
                  <h2 className='article-article__title'>{title}</h2>
                  <div className='article-article__bar'>
                    {date && (
                      <div className='article-article__bar__date'>
                        <div className='article-article__bar__date__icon material-icons'>
                          alarm
                        </div>
                        <p className='article-article__bar__date__text'>
                          {date}
                        </p>
                      </div>
                    )}
                    <a
                      href={`${editBaseUrl}${path}`}
                      target='_blank'
                      className='article-article__bar__edit'
                    >
                      수정하기
                    </a>
                  </div>
                  {titleImage && (
                    <img
                      className='article-article__title-image'
                      src={titleImage}
                      alt={title}
                    />
                  )}
                  <div className='article-article__contents' ref={contentsRef}>
                    <Markdown
                      text={contentsWithoutHeader}
                      startHeadingObserver={startHeadingObserver}
                    />
                  </div>
                </>
              )
            }}
          </AsyncBlock>
        </article>
        <aside className='article-aside' ref={asideRef}>
          <div
            className='article-aside__bg'
            onClick={(e) => {
              closer(e, asideRef)
            }}
          ></div>
          <div className='article-aside__menu'>
            <ul className='article-aside__scroll' ref={tocRef}>
              <AsyncBlock resolve={data.contents}>
                {(fetched: any) => {
                  const { contentsWithoutHeader } = fetched
                  const headings = headingObserver.tableOfContentsFromContents(
                    contentsWithoutHeader
                  )

                  return <TocItem headings={headings} />
                }}
              </AsyncBlock>
            </ul>
            <div
              className='article-aside__toggler material-icons'
              onClick={(e) => {
                toggler(e, asideRef)
              }}
            >
              segment
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

export default Article
