## 깃헙 API로 커밋하기

```javascript
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
```
