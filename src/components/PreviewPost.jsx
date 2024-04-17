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
  if (!contents) {
    return {
      found: false,
    }
  }

  let s = 0
  while (contents[s] === ' ' && s < contents.length) {
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
    metadata: contents.slice(s, e),
  }
}

function extractSummary(contents) {
  const { metadata, found } = findMetadataArea(contents)
  if (!found) {
    return ''
  }

  const key = 'summary:'
  let s = metadata.indexOf(key)
  if (s === -1) {
    return ''
  }
  s += key.length

  while (metadata[s] === ' ') {
    s++
  }

  let e = metadata.indexOf('\n', s)
  return metadata.slice(s, e)
}

function extractDate(contents) {
  const { metadata, found } = findMetadataArea(contents)
  if (!found) {
    return ''
  }

  const pattern = /(?<=^date\:\s*)[0-9\-]+(?=\s?)/m
  const date = metadata.match(pattern)
  if (date) {
    return date[0]
  }
  return date
}

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
