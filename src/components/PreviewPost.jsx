import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from './UI/Card'
import { fetchRepositoryPostsFileContents } from '../utils/github'
import {
  extractDate,
  extractSummary,
  extractTitle,
  extractTitleImage,
} from '../utils/post'

export default (props) => {
  const { post } = props
  const [contents, setContents] = useState()

  useEffect(() => {
    async function fetchPost() {
      const contents = await fetchRepositoryPostsFileContents({
        path: post.path,
      })
      if (!contents?.isError) {
        setContents(contents)
      }
    }

    fetchPost()
  }, [post])

  const title = extractTitle(post.path)
  const date = extractDate(contents)
  const summary = extractSummary(contents)
  const titleImage = extractTitleImage(contents)

  return (
    <Link to={`posts/${post.path}`} key={post.path}>
      <Card imgSrc={titleImage} title={title} date={date}>
        {summary}
      </Card>
    </Link>
  )
}
