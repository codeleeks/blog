import { useEffect } from 'react'
import TableOfContentsItem from './TableOfContentsItem'
import { useAsyncValue } from 'react-router-dom'
import { postTocObserver } from '../../utils/toc'

function getHeadingItemEls() {
  return Array.from(
    document.querySelector('.post-page').querySelectorAll('aside ul li')
  )
}
export default (props) => {
  const contents = useAsyncValue()
  const tableOfContents = postTocObserver.tableOfContentsFromContents(contents)
  useEffect(() => {
    postTocObserver.register(getHeadingItemEls(), contents)
    return () => {
      postTocObserver.clear()
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
