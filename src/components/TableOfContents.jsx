import GithubSlugger from 'github-slugger'
import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)

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
  const [tableOfContents, setTableOfContents] = useState([])
  const { contents } = props

  useEffect(() => {
    setTableOfContents(getTableOfContents(contents))
  }, [contents])

  const clickHandler = (e) => {
    e.preventDefault()

    const slug = e.target.attributes.href.value
    console.log(slug)
    gsap.to(window, { duration: 1, scrollTo: {
      y: slug,
      offsetY: 10
    } })
  }

  return (
    <ul>
      <h4>목차</h4>
      {tableOfContents.map((heading) => {
        return (
          <li
            key={heading.slug}
            className={`heading-${heading.level}`}
            onClick={clickHandler}
          >
            <a href={`#${heading.slug}`}>{heading.text}</a>
          </li>
        )
      })}
    </ul>
  )
}
