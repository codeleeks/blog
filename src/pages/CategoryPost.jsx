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

export default function CategoryPostPage(props) {
  const { category, postFileName } = useParams()
  const { contents, posts } = useLoaderData()

  const title = extractTitle(`${category}/${postFileName}`)
  return (
    <section className='post-page'>
      <PostsNavigation>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={posts} errorElement={<AsyncError />}>
            <PostsNavigationContents />
          </Await>
        </Suspense>
      </PostsNavigation>
      <section className='post'>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={contents}>
            {(fetchedContents) => {
              return <PostContents title={title} contents={fetchedContents} />
            }}
          </Await>
        </Suspense>
      </section>
      <TableOfContents>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={contents}>
            <TableOfContentsContents key={contents}/>
          </Await>
        </Suspense>
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
