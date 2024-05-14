import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { extractTitleImage, skipMetadata } from '../../utils/post'
import {
  extractTitle,
  extractLevel,
  extractBody,
  findAllMessageBoxArea,
} from '../../utils/messagebox'
import MarkdownView from './MarkdownView'

function replaceMessagebox(skipped) {
  let replaced = skipped
  for (const messageBoxArea of findAllMessageBoxArea(skipped)) {
    const level = extractLevel(messageBoxArea.str)
    const title = extractTitle(messageBoxArea.str)
    const body = extractBody(messageBoxArea.str)

    replaced = replaced.replace(
      messageBoxArea.str,
      `<div class='message-box ${level}'>
        <h5 class='message-title'>${title}</h5>
        <p class='message-contents'>${body}</p>
      </div>`
    )
  }

  return replaced
}

export default (props) => {
  const { title, contents } = props
  const titleImg = extractTitleImage(contents)
  const skipped = skipMetadata(contents)
  return (
    <>
      <h1 className='title'>{title}</h1>
      <img src={titleImg} alt={title} className='title-image' />
      <div className='contents'>
        <MarkdownView text={skipped} />
      </div>
    </>
  )
}
