import {
  Await,
  Link,
  NavLink,
  defer,
  useLoaderData,
  useParams,
} from 'react-router-dom'
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
import TableOfContents from '../components/Post/TableOfContents'
import PostsNavigation from '../components/Post/PostsNavigation'

export default function CategoryPostPage(props) {
  const { category, postFileName } = useParams()
  const { contents, posts } = useLoaderData()

  const title = extractTitle(`${category}/${postFileName}`)

  return (
    <section className='post-page'>
      <nav>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={posts}>
            {(fetchedPosts) => {
              return (
                <section>
                  {Object.entries(fetchedPosts).map(([category, posts]) => {
                    console.log(category, posts)
                    return <PostsNavigation key={category} category={category} posts={posts}/>
                  })}
                </section>
              )
            }}
          </Await>
        </Suspense>
      </nav>
      <section className='post'>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={contents}>
            {(fetchedContents) => {
              return (
                <>
                  <h1 className='title'>{title}</h1>
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
      </section>
      <aside>
        <Suspense fallback={<LoadingIndicator />}>
          <Await resolve={contents}>
            {(fetchedContents) => {
              return <TableOfContents contents={fetchedContents} />
            }}
          </Await>
        </Suspense>
      </aside>
    </section>
  )
}

async function fetchPosts() {
  const allPosts = await fetchRepositoryPosts()
  throwErrorJsonIfError(allPosts)
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
