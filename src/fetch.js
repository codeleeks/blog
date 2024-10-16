import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { defer } from 'react-router'

const config = {
  token: process.env.VITE_GITHUB_ACCESS_TOKEN,
  owner: 'codeleeks',
  repo: 'blog',
  postsBranch: 'codeleeks-posts',
  snippetsBranch: 'codeleeks-snippets',
}

export const postEditBaseUrl =
  'https://github.com/codeleeks/blog/blob/codeleeks-posts/'

export const snippetEditBaseUrl =
  'https://github.com/codeleeks/blog/blob/codeleeks-snippets/'

export function extractHeader(key, contents) {
  let matched = /(?<=---)(.*?)(?=---)/gs.exec(contents)
  if (!matched) return undefined
  let header = matched[1]

  matched = undefined
  switch (key) {
    case 'summary':
      matched = /(?<=summary:)(.*?)(?=\n)/g.exec(header)
      break
    case 'date':
      matched = /(?<=date:)(.*?)(?=\n)/g.exec(header)
      break
    case 'title-image':
      matched = /(?<=title-image: \')(.*?)(?=\'\n)/g.exec(header)
      break
    default:
      break
  }
  if (!matched) return undefined

  let value = matched[1]

  for (let index = 0; index < value.length; index++) {
    if (value[index] !== ' ') {
      value = value.slice(index)
      break
    }
  }
  return value
}

function extractCategory(path) {
  const last = path.lastIndexOf('/')
  const category = path.substring(0, last)
  return category
}

function extractTitle(path) {
  const last = path.lastIndexOf('/')
  const ext = path.lastIndexOf('.md')
  const title = path.substring(last + 1, ext)
  return title
}

export function removeHeaderFromContents(contents) {
  const regex = /-{3}\n(.*?)-{3}\n/gs
  const matched = regex.exec(contents)
  if (!matched) return contents

  const removed = contents.replace(regex, '')
  let removedLineFeed = removed
  for (let index = 0; index < removed.length; index++) {
    const element = removed[index]
    if (element !== '\n') {
      removedLineFeed = removedLineFeed.slice(index)
      break
    }
  }

  return removedLineFeed
}

async function fetchArticle(path, branch) {
  const { owner, repo, token } = config
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github.raw+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!resp.ok) {
    throw new Error(`could not fetch contents ${path}`)
  }

  const contents = new TextDecoder().decode(
    new Uint8Array(await resp.arrayBuffer())
  )

  return {
    path,
    contentsWithoutHeader: removeHeaderFromContents(contents),
    title: extractTitle(path),
    category: extractCategory(path),
    summary: extractHeader('summary', contents),
    date: extractHeader('date', contents),
    titleImage: extractHeader('title-image', contents),
  }
}

async function fetchArticles(branch) {
  const { owner, repo, token } = config

  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=true`

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-Github-Api-Version': '2022-11-28',
    },
  })

  if (!resp.ok) {
    throw new Error(`could not fetch articles ${branch}`)
  }

  const json = await resp.json()
  const { tree } = json
  const posts = tree
    .filter(
      (t) =>
        t.mode === '100644' && t.path.endsWith('.md') && t.path !== 'README.md'
    )
    .map((cur) => {
      const post = {
        ...cur,
        title: extractTitle(cur.path),
        category: extractCategory(cur.path),
        fetchContents(callback, includeContents = false) {
          fetchArticle(cur.path, branch).then((article) => {
            const { summary, date, titleImage, contentsWithoutHeader } = article
            this.summary = summary
            this.date = date
            this.titleImage = titleImage
            if (includeContents) {
              this.contentsWithoutHeader = contentsWithoutHeader
            }

            callback(this)
          })
        },
      }
      return post
    })

  return posts
}

export async function fetchPost(path) {
  return fetchArticle(path, config.postsBranch)
}

export async function fetchPosts() {
  return fetchArticles(config.postsBranch)
}

export async function fetchSnippet(path) {
  return fetchArticle(path, config.snippetsBranch)
}

export async function fetchSnippets() {
  return fetchArticles(config.snippetsBranch)
}

export function postsLoader() {
  return defer({ posts: fetchPosts() })
}

export function postContentsLoader({ params }) {
  return defer({
    contents: fetchPost(params['*']),
    articles: fetchPosts(),
  })
}

export function snippetsLoader() {
  return defer({ snippets: fetchSnippets() })
}

export function snippetContentsLoader({ params }) {
  return defer({
    contents: fetchSnippet(params['*']),
    articles: fetchSnippets(),
  })
}
