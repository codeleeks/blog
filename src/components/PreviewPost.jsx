import { useEffect, useState } from 'react'
import { Link, json } from 'react-router-dom'
import Card from './UI/Card'
import { fetchRepositoryFileContents } from '../utils/github'
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

function findMetadataArea(contents) {
  let s = 0
  while (contents[s] === ' ') {
    s++
  }

  if (contents[s] !== '-') {
    return {
      found: false,
    }
  }

  s = contents.indexOf('---', s)
  while (contents[s] === '-') {
    s++
  }
  if (contents[s] === '\n') s++

  let e = s
  e = contents.indexOf('---', e)

  if (e === contents.length) {
    return {
      found: false,
    }
  }

  return {
    found: true,
    summary: contents.slice(s, e),
  }
}

function extractSummary(contents) {
  const { summary, found } = findMetadataArea(contents)
  if (!found) {
    return ''
  }

  const key = 'summary:'
  let s = summary.indexOf(key)
  if (s === -1) {
    return ''
  }
  s += key.length

  while (summary[s] === ' ') {
    s++
  }

  let e = summary.indexOf('\n', s)
  return summary.slice(s, e)
}

export default (props) => {
  const { post } = props
  const [contents, setContents] = useState()

  const title = extractTitle(post.path)
  useEffect(() => {
    async function fetchPost() {
      const contents = await fetchRepositoryFileContents(post.path)
      if (!contents?.isError) {
        const summary = extractSummary(contents)
        setContents(summary)
      }
    }

    fetchPost()
  }, [post])

  return (
    <Link to={`${title}.md`} key={post.path}>
      <Card title={title}>{contents}</Card>
    </Link>
  )
}
