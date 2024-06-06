import { useEffect } from 'react'
import TableOfContentsItem from './TableOfContentsItem'

export default (props) => {
  const { contents, getHeadingItemEls, tocObserver } = props
  const tableOfContents = tocObserver.tableOfContentsFromContents(contents)
  useEffect(() => {
    tocObserver.register(getHeadingItemEls(), contents)
    return () => {
      tocObserver.clear()
    }
  }, [contents])

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
