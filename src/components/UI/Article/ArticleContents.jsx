import { useEffect, useRef } from 'react'
import MarkdownView from '../Markdown/MarkdownView'

const ArticleContents = (props) => {
  const ref = useRef(null)
  const { title, contents, titleImg, tocObserver } = props

  const observeHeadings = () => {
    if (ref.current.childNodes) {
      const headingEls = Array.from(ref.current.childNodes)
        .filter((node) => {
          return node.nodeName.match(/H[1-6]/)
        })
      
        tocObserver.start(headingEls)
    }
  }

  return (
    <>
      <h1 className='title'>{title}</h1>
      {titleImg && <img src={titleImg} alt={title} className='title-image' />}
      <div className='contents' ref={ref}>
        <MarkdownView
          text={contents}
          observeHeadings={observeHeadings}
        />
      </div>
    </>
  )
}

export default ArticleContents
