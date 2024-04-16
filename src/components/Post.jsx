import { useEffect, useState } from 'react'
import { Link, json } from 'react-router-dom'
import Card from './UI/Card'
import { fetchRepositoryFileContents } from '../utils/github'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/a11y-dark.css'

function extractTitle(path) {
  let s = -1,
    e = -1
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] === '/') {
      s = i + 1
      break
    } else if (path[i] === '.') {
      e = i
    }
  }

  if (s > 0 && e > 0) {
    return path.substring(s, e)
  }
}

export default (props) => {
  const { post } = props
  const [contents, setContents] = useState()

  const title = extractTitle(post.path)
  // fetchRepositoryFileContents
  useEffect(() => {
    async function fetchPost() {}

    fetchPost()
  }, [post])

  return (
    <Link to={`${title}.md`} key={post.path}>
      <Card title={title}>{contents}</Card>
    </Link>
  )
}

async function fetchPost(postPath) {
  const contents = await fetchRepositoryFileContents(postPath)

  if (contents?.isError) {
    throw json({
      message: contents.message,
      status: contents.status,
    })
  }
  return contents
}

export async function loader({ params }) {
  console.log(params)

  return await fetchPost(params.path)
}
