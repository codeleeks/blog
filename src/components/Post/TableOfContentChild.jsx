import GithubSlugger from 'github-slugger'
import { useEffect } from 'react'
import TableOfContentsItem from './TableOfContentsItem'
import { useAsyncValue } from 'react-router-dom'

function getTableOfContents(contents) {
  const slugger = new GithubSlugger()
  const adjustLevels = (levels) => {
    let min = 6
    for (const level of levels) {
      if (level < min) {
        min = level
        if (min === 1) {
          break
        }
      }
    }

    return levels.map((level) => level - min + 1)
  }

  const pattern = /(?<level>^#+)\s(?<text>.+)$/gm

  const headings = [...contents.matchAll(pattern)]

  const adjustedLevels = adjustLevels(
    headings.map((heading) => heading.groups.level.length)
  )

  return headings.map((heading, index) => ({
    level: adjustedLevels[index],
    text: heading.groups.text,
    slug: slugger.slug(heading.groups.text),
  }))
}
export default (props) => {
  const contents = props.contents
  const tableOfContents = getTableOfContents(contents)
  useEffect(() => {
    const postPageEl = document.querySelector('.post-page')
    const headingItemEls = Array.from(
      postPageEl.querySelectorAll('aside ul li')
    )
    // console.log(document.querySelector('.post-page aside ul li'))
    // console.log(headingItemEls)
    const slugToAnchor = headingItemEls.reduce((acc, el) => {
      const slug = el.querySelector('a').getAttribute('href').slice(1)
      return { ...acc, [slug]: el }
    }, {})

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          slugToAnchor[entry.target.id].classList.add('visible')
        } else {
          slugToAnchor[entry.target.id].classList.remove('visible')
        }
      })
    })

    const contentsHeadingEls = postPageEl
      .querySelector('.post .contents')
      .querySelectorAll('h1,h2,h3,h4,h5,h6')

    // console.log(document.querySelector('.post-page .post .contents'))
    // console.log(contentsHeadingEls)
    contentsHeadingEls.forEach((el) => {
      if (
        el.textContent &&
        tableOfContents.some((heading) => heading.slug === el.id)
      ) {
        console.log(el)
        io.observe(el)
      }
    })

    return () => {
      io.disconnect()
    }
  }, [tableOfContents])

  return (
    <>
      <h4>목차</h4>
      <ul>
        {tableOfContents.map((heading) => {
          return <TableOfContentsItem key={heading.slug} heading={heading} />
        })}
      </ul>
    </>
  )
}
