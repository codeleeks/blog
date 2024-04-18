import { Await, Link, defer, useLoaderData, useParams } from 'react-router-dom'
import {
  fetchRepositoryFileContents,
  fetchRepositoryPosts,
} from '../utils/github'
import { throwErrorJsonIfError } from '../utils/loader-error'
import { Suspense } from 'react'
import LoadingIndicator from '../components/UI/LoadingIndicator'
import Markdown from 'react-markdown'
import { extractTitle, skipMetadata } from '../utils/post'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import 'highlight.js/styles/github-dark-dimmed.min.css'
import rehypeRaw from 'rehype-raw'
import TableOfContents from '../components/TableOfContents'



export default function CategoryPostPage(props) {
  const { category } = useParams()
  const { contents, posts } = useLoaderData()

  return (
    <section className='post-page'>
      <div className='other-posts'>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={posts}>
            {(fetchedPosts) => {
              return (
                <>
                  <h2>{category}</h2>
                  <ul>
                    {fetchedPosts.map((post) => (
                      <li key={post.sha}>{extractTitle(post.path)}</li>
                    ))}
                  </ul>
                </>
              )
            }}
          </Await>
        </Suspense>
      </div>
      <div className='post'>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={contents}>
            {(fetchedContents) => {
              return (
                <>
                  <h1 className='title'>타이틀</h1>
                  <Markdown
                    rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeSlug]}
                  >
                    {skipMetadata(fetchedContents)}
                  </Markdown>
                </>
              )
            }}
          </Await>
        </Suspense>
      </div>
      <div className='toc'>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={contents}>
            {(fetchedContents) => {
              return <TableOfContents contents={fetchedContents} />
            }}
          </Await>
        </Suspense>
      </div>
    </section>
  )
}

async function fetchPosts(params) {
  const { category } = params

  const allPosts = await fetchRepositoryPosts()
  throwErrorJsonIfError(allPosts)
  return allPosts[category]
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
    posts: fetchPosts(params),
  })
}
