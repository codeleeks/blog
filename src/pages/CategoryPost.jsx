import { defer, useLoaderData, useParams } from 'react-router-dom'
import {
  fetchRepositoryFileContents,
  fetchRepositoryPosts,
} from '../utils/github'
import {  useState } from 'react'
import { extractTitle } from '../utils/post'

import TableOfContents from '../components/Post/TableOfContents'
import PostsNavigation from '../components/Post/PostsNavigation'

import 'highlight.js/styles/github-dark-dimmed.min.css'
import PostContents from '../components/Post/PostContents'
import PostsNavigationContents from '../components/Post/PostsNavigationContents'
import TableOfContentsContents from '../components/Post/TableOfContentsContents'
import AsyncBlock from '../components/AsyncBlock'
import { postContext } from '../hooks/usePostContext'
export default function CategoryPostPage(props) {
  const { category, postFileName } = useParams()
  const { contents, posts } = useLoaderData()

  const [isComplied, setIsCompiled] = useState(false)

  const title = extractTitle(`${category}/${postFileName}`)
  return (
    <postContext.Provider value={{ isComplied, setIsCompiled }}>
      <section className='post-page inner'>
        <PostsNavigation>
          <AsyncBlock resolve={posts}>
            <PostsNavigationContents />
          </AsyncBlock>
        </PostsNavigation>
        <section className='post'>
          <AsyncBlock resolve={contents}>
            {(fetchedContents) => {
              return <PostContents title={title} contents={fetchedContents} />
            }}
          </AsyncBlock>
        </section>
        <TableOfContents>
          <AsyncBlock resolve={contents}>
            <TableOfContentsContents key={isComplied} />
          </AsyncBlock>
        </TableOfContents>
      </section>
    </postContext.Provider>
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
