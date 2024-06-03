import GithubSlugger from 'github-slugger'
import { useEffect } from 'react'
import TableOfContentsItem from './TableOfContentsItem'
import { useAsyncValue } from 'react-router-dom'
import { clear, updateObserver } from '../../utils/toc'

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
  const contents = useAsyncValue()
  const tableOfContents = getTableOfContents(contents)
  useEffect(() => {
    updateObserver(tableOfContents)
    return () => {
      clear()
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
