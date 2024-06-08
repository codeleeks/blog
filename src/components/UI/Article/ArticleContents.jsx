import MarkdownView from '../Markdown/MarkdownView'

const ArticleContents = (props) => {
  const { title, contents, titleImg, tocObserver } = props
  return (
    <>
      <h1 className='title'>{title}</h1>
      {titleImg && <img src={titleImg} alt={title} className='title-image' />}
      <div className='contents'>
        <MarkdownView text={contents} tocObserver={tocObserver} />
      </div>
    </>
  )
}

export default ArticleContents
