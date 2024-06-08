import { defer, useParams } from 'react-router-dom'
import {
  fetchRepositoryPostsFileContents,
  fetchRepositoryPosts,
} from '../utils/github'
import { extractTitle } from '../utils/post'

import 'highlight.js/styles/github-dark-dimmed.min.css'
import PostContents from '../components/Post/PostContents'
import AsyncBlock from '../components/AsyncBlock'
import { queryClient } from '../utils/react-query'
import { useQuery } from '@tanstack/react-query'
import PostTableOfContents from '../components/Post/PostTableOfContents'
import PostNavigationContents from '../components/Post/PostNavigationContents'
import Article from '../components/UI/Article/Article'
export default function CategoryPostPage(props) {
  const { category, postFileName } = useParams()
  const { data: postsData } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchRepositoryPosts,
  })
  const path = category + '/' + postFileName
  const { data: contentsData } = useQuery({
    queryKey: ['posts', path],
    queryFn: () => fetchRepositoryPostsFileContents({ path }),
  })

  const posts = Promise.resolve(postsData)
  const contents = Promise.resolve(contentsData)

  const title = extractTitle(`${category}/${postFileName}`)

  const NavigationComponent = (
    <AsyncBlock resolve={posts}>
      {(fetchedPosts) => {
        return <PostNavigationContents posts={fetchedPosts} />
      }}
    </AsyncBlock>
  )

  const ArticleComponent = (
    <AsyncBlock resolve={contents}>
      {(fetchedContents) => {
        return <PostContents title={title} contents={fetchedContents} />
      }}
    </AsyncBlock>
  )

  const TableOfContentsComponent = (
    <AsyncBlock resolve={contents}>
      {(fetchedContents) => {
        return <PostTableOfContents contents={fetchedContents} />
      }}
    </AsyncBlock>
  )

  return (
    <Article
      NavigationComponent={NavigationComponent}
      ArticleComponent={ArticleComponent}
      TableOfContentsComponent={TableOfContentsComponent}
    />
  )
}

async function fetchPosts() {
  return queryClient.fetchQuery({
    queryKey: ['posts'],
    queryFn: fetchRepositoryPosts,
  })
}

async function fetchPostContents(params) {
  const { category, postFileName } = params
  const path = category + '/' + postFileName
  return queryClient.fetchQuery({
    queryKey: ['posts', path],
    queryFn: () => fetchRepositoryPostsFileContents({ path }),
  })
}
export async function loader({ params }) {
  return defer({
    contents: fetchPostContents(params),
    posts: fetchPosts(),
  })
}
