import { Await, defer, useLoaderData, useParams } from 'react-router-dom'
import {
  fetchRepositoryFileContents,
  fetchRepositoryPosts,
} from '../utils/github'
import { Suspense } from 'react'
import LoadingIndicator from '../components/UI/LoadingIndicator'
import { extractTitle } from '../utils/post'

import TableOfContents from '../components/Post/TableOfContents'
import PostsNavigation from '../components/Post/PostsNavigation'

import 'highlight.js/styles/github-dark-dimmed.min.css'
import PostContents from '../components/Post/PostContents'
import AsyncError from './AsyncError'
import PostsNavigationContents from '../components/Post/PostsNavigationContents'
import TableOfContentsContents from '../components/Post/TableOfContentsContents'
import AsyncBlock from '../components/AsyncBlock'

export default function CategoryPostPage(props) {
  const { category, postFileName } = useParams()
  const { contents, posts } = useLoaderData()

  const title = extractTitle(`${category}/${postFileName}`)
  return (
    <section className='post-page'>
      <PostsNavigation>
        <AsyncBlock resolve={posts}>
          <PostsNavigationContents />
        </AsyncBlock>
      </PostsNavigation>
      <section className='post inner'>
        <AsyncBlock resolve={contents}>
          {(fetchedContents) => {
            return <PostContents title={title} contents={fetchedContents} />
          }}
        </AsyncBlock>
      </section>
      <TableOfContents>
        <AsyncBlock resolve={contents}>
          <TableOfContentsContents key={contents} />
        </AsyncBlock>
      </TableOfContents>
    </section>
  )
}

async function fetchPosts() {
  const allPosts = await fetchRepositoryPosts()
  return allPosts
}

async function fetchPostContents(params) {
  const { category, postFileName } = params
  const contents = await fetchRepositoryFileContents(
    category + '/' + postFileName
  )
  return contents
}
export async function loader({ params }) {
  return defer({
    contents: fetchPostContents(params),
    posts: fetchPosts(),
  })
}
