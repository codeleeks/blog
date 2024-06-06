// refs: https://gist.github.com/maskaravivek/a477c2c98651bdfbda5b99a81b261c37#file-twt-1b5e2427-e5fc-49c4-a29e-a305fce63aab-js
// also details about this behavior in https://dev.to/bro3886/create-a-folder-and-push-multiple-files-under-a-single-commit-through-github-api-23kc

import { throwErrorJson } from './error'

const config = {
  token: import.meta.env.VITE_GITHUB_ACCESS_TOKEN,
  owner: 'codeleeks',
  repo: 'blog',
  branch: 'codeleeks-posts',
}

async function _fetchRepositoryPosts(owner, repo, branch) {
  const { token } = config
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=true`

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!resp.ok) {
    throwErrorJson(resp.status, 'could not fetch repository&apos;s trees')
  }

  const { tree } = await resp.json()

  const postTree = tree
    .filter((tree) => tree.mode === '040000')
    .reduce((acc, cur) => {
      acc[cur.path] = [
        ...tree.filter(
          (tree) =>
            tree.mode === '100644' && tree.path.startsWith(cur.path + '/')
        ),
      ]
      return acc
    }, {})

  console.log(postTree)
  return postTree
}

async function _fetchRepositoryFileContents(owner, repo, branch, path) {
  const { token } = config
  if (path[0] === '/') {
    path = path.slice(1)
  }

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
    console.error(resp)
    throwErrorJson(resp.status, 'could not fetch file contents')
  }

  const content = new TextDecoder().decode(
    new Uint8Array(await resp.arrayBuffer())
  )
  return content
}

// Github Dir Read API
export async function fetchRepositoryPosts() {
  const { owner, repo, branch } = config
  return _fetchRepositoryPosts(owner, repo, branch)
}

// Github File Contents Read API
export async function fetchRepositoryPostsFileContents({ path }) {
  const { owner, repo, branch } = config
  return _fetchRepositoryFileContents(owner, repo, branch, path)
}

// Fetch code snippets from github repository
export function fetchCodeSnippets() {
  const { owner, repo } = config
  const branch = 'codeleeks-snippets'
  return _fetchRepositoryPosts(owner, repo, branch)
}

// Fetch code snippets contents from github repository
export function fetchRepositoryCodeSnippetsFileContents({ path }) {
  const { owner, repo } = config
  const branch = 'codeleeks-snippets'
  return _fetchRepositoryFileContents(owner, repo, branch, path)
}
