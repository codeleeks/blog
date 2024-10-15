import { evaluate } from '@mdx-js/mdx'
import { Fragment, useEffect, useRef, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import AsyncBlock from './AsyncBlock'
import ErrorBlock from './ErrorBlock'
import { gsap } from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import { NavLink } from 'react-router-dom'

const MessageBox = (props) => {
  const { title, level, children } = props
  return (
    <div className={`article-article__contents__message-box ${level}`}>
      <h6 className='article-article__contents__message-box__message-title'>
        {title}
      </h6>
      <div className='article-article__contents__message-box__message-contents'>
        {children}
      </div>
    </div>
  )
}

export const components = {
  MessageBox(props) {
    const { children, ...rest } = props
    return <MessageBox {...rest}>{children}</MessageBox>
  },
  code({ className, ...properties }) {
    const match = /language-(\w+)/.exec(className || '')
    return (
      <code
        className={match ? className : `hljs language-plaintext`}
        {...properties}
      />
    )
  },
  a({ children, ...rest }) {
    return (
      <a {...rest} target='_blank'>
        {children}
      </a>
    )
  },
}

export async function evaluateMarkdown(text) {
  const module = await evaluate(text, {
    ...runtime,
    baseUrl: import.meta.url,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight, rehypeSlug],
  })
  return module
}

const Markdown = (props) => {
  const { text, startHeadingObserver } = props
  const [mdxModule, setMdxModule] = useState(null)
  const [error, setError] = useState({ msg: undefined })

  useEffect(() => {
    ;(async () => {
      try {
        const module = await evaluateMarkdown(text)
        setMdxModule(module)
        setError({ msg: undefined })
      } catch (e) {
        console.log(e.message)
        setError({ msg: e.message })
      }
    })()
  }, [text])

  useEffect(() => {
    if (mdxModule) {
      startHeadingObserver(text)
    }
  }, [mdxModule, text])

  let Content = Fragment
  if (error.msg) {
    Content = <ErrorBlock title='An Error Occurred!' message={error.msg} />
    return Content
  }
  if (mdxModule) {
    Content = mdxModule.default
    return <Content components={components} />
  }

  return <Content />
}

gsap.registerPlugin(ScrollToPlugin)
function scrollTo(target, config) {
  gsap.to(target, config)
}

const TocItem = (props) => {
  const { headings } = props
  const timer = useRef()
  let headingSlug

  const scroller = (e) => {
    e.preventDefault()
    const slug = e.target.attributes.href.value
    scrollTo(window, {
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

const Article = (props) => {
  const { loaderData: data, headingObserver } = props
  const contentsRef = useRef(null)
  const tocRef = useRef(null)
  const navRef = useRef(null)
  const asideRef = useRef(null)

  const startHeadingObserver = (contents) => {
    if (contentsRef.current.childNodes) {
      if (tocRef.current.childNodes) {
        headingObserver.clear()
        const tocHeadingEls = Array.from(tocRef.current.childNodes)
        headingObserver.register(tocHeadingEls, contents)
        const contentsHeadingEls = Array.from(
          contentsRef.current.childNodes
        ).filter((node) => node.nodeName.match(/h[1-6]/i))
        headingObserver.start(contentsHeadingEls)
      }
    }
  }

  const toggler = (e, ref) => {
    e.stopPropagation()
    ref.current.classList.toggle('toggled')
    document.body.classList.toggle('toggled')
  }

  const closer = (e, ref) => {
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
                {(fetchedArticles) => {
                  const articlesPerCategory = fetchedArticles.reduce(
                    (acc, cur) => {
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
                          {articles.map((article) => (
                            <li
                              className='article-nav__scroll__nav-item__articles__item'
                              key={article.path}
                            >
                              <NavLink
                                to={`/posts/${article.path}`}
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
            {(fetched) => {
              const { title, titleImage, date, contentsWithoutHeader } = fetched
              return (
                <>
                  <h2 className='article-article__title'>{title}</h2>
                  <div className='article-article__bar'>
                    <div className='article-article__bar__date'>
                      <div className='article-article__bar__date__icon material-icons'>
                        alarm
                      </div>
                      <p className='article-article__bar__date__text'>{date}</p>
                    </div>
                    <div className='article-article__bar__edit'>수정하기</div>
                  </div>
                  <img
                    className='article-article__title-image'
                    src={titleImage}
                    alt={title}
                  />
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
                {(fetched) => {
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
