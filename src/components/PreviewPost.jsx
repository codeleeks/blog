import { useEffect, useState } from 'react'
import { Link, json } from 'react-router-dom'
import Card from './UI/Card'
import { fetchRepositoryFileContents } from '../utils/github'
import { extractDate, extractSummary, extractTitle } from '../utils/post'

export default (props) => {
  const { post } = props
  const [contents, setContents] = useState()

  useEffect(() => {
    async function fetchPost() {
      const contents = await fetchRepositoryFileContents(post.path)
      if (!contents?.isError) {
        setContents(contents)
      }
    }

    fetchPost()
  }, [post])

  const title = extractTitle(post.path)
  const date = extractDate(contents)
  const summary = extractSummary(contents)

  return (
    <Link to={`${title}.md`} key={post.path}>
      <Card title={title} date={date}>{summary}</Card>
    </Link>
  )
}
