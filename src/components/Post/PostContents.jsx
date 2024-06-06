import { extractTitleImage, skipMetadata } from '../../utils/post'
import MarkdownView from '../UI/MarkdownView'
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
