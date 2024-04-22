// refs: https://gist.github.com/maskaravivek/a477c2c98651bdfbda5b99a81b261c37#file-twt-1b5e2427-e5fc-49c4-a29e-a305fce63aab-js
// also details about this behavior in https://dev.to/bro3886/create-a-folder-and-push-multiple-files-under-a-single-commit-through-github-api-23kc

import { throwErrorJson } from './error'

const config = {
  token: import.meta.env.VITE_GITHUB_ACCESS_TOKEN,
  owner: 'codeleeks',
  repo: 'blog',
  branch: 'codeleeks-posts',
}

const createGithubFileBlob = async (
  githubAccessToken,
  owner,
  repoFullName,
  content,
  encoding = 'utf-8'
) => {
  const blobResp = await fetch(
    `https://api.github.com/repos/${owner}/${repoFullName}/git/blobs`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubAccessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        content: content,
        encoding: encoding,
      }),
    }
  )
  const response = await blobResp.json()

  return response.sha
}

const getShaForBaseTree = async (
  githubAccessToken,
  owner,
  repoFullName,
  branchName
) => {
  const baseTreeResp = await fetch(
    `https://api.github.com/repos/${owner}/${repoFullName}/git/trees/${branchName}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubAccessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )
  const response = await baseTreeResp.json()

  return response.sha
}

const getParentSha = async (
  githubAccessToken,
  owner,
  repoFullName,
  branchName
) => {
  const parentResp = await fetch(
    `https://api.github.com/repos/${owner}/${repoFullName}/git/refs/heads/${branchName}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubAccessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )
  const response = await parentResp.json()

  return response.object.sha
}

const createGithubRepoTree = async (
  githubAccessToken,
  owner,
  repoFullName,
  branchName,
  articleFiles
) => {
  const shaForBaseTree = await getShaForBaseTree(
    githubAccessToken,
    owner,
    repoFullName,
    branchName
  )

  const tree = []

  for (var i = 0; i < articleFiles.length; i++) {
    const fileSha = await createGithubFileBlob(
      githubAccessToken,
      owner,
      repoFullName,
      articleFiles[i].content
    )

    console.log(articleFiles[i].path.substring(1))
    tree.push({
      path: articleFiles[i].path.substring(1),
      mode: '100644',
      type: 'blob',
      sha: fileSha,
    })
  }

  const payload = {
    base_tree: shaForBaseTree,
    tree: tree,
  }

  const treeResp = await fetch(
    `https://api.github.com/repos/${owner}/${repoFullName}/git/trees`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubAccessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(payload),
    }
  )
  const response = await treeResp.json()

  return response.sha
}

export const createGithubCommit = async (
  githubAccessToken,
  owner,
  repoFullName,
  branchName,
  commitMessage,
  articleFiles
) => {
  const tree = await createGithubRepoTree(
    githubAccessToken,
    owner,
    repoFullName,
    branchName,
    articleFiles
  )
  const parentSha = await getParentSha(
    githubAccessToken,
    owner,
    repoFullName,
    branchName
  )

  const payload = {
    message: commitMessage,
    tree: tree,
    parents: [parentSha],
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoFullName}/git/commits`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubAccessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(payload),
    }
  )

  const commitResp = await response.json()
  const commitSha = commitResp.sha

  await updateGithubBranchRef(
    githubAccessToken,
    owner,
    repoFullName,
    branchName,
    commitSha
  )
}

const updateGithubBranchRef = async (
  githubAccessToken,
  owner,
  repoFullName,
  branchName,
  commitSha
) => {
  const payload = {
    sha: commitSha,
    force: false,
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoFullName}/git/refs/heads/${branchName}`,
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubAccessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(payload),
    }
  )

  const commitResp = await response.json()
}

// Github Dir Read API
export async function fetchRepositoryPosts() {
  const { token, owner, repo, branch } = config
  console.log(token)
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

  return postTree
}

// Github File Contents Read API
export async function fetchRepositoryFileContents(path) {
  const { token, owner, repo, branch } = config

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
    throwErrorJson(resp.status, 'could not fetch file contents')
  }

  const content = new TextDecoder().decode(
    new Uint8Array(await resp.arrayBuffer())
  )

  return content
}
