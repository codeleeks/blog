import { defer, useLoaderData, useParams } from 'react-router-dom'
import {
  fetchRepositoryFileContents,
  fetchRepositoryPosts,
} from '../utils/github'
import { useState } from 'react'
import { extractTitle } from '../utils/post'

import TableOfContents from '../components/Post/TableOfContents'
import PostsNavigation from '../components/Post/PostsNavigation'

import 'highlight.js/styles/github-dark-dimmed.min.css'
import PostContents from '../components/Post/PostContents'
import PostsNavigationContents from '../components/Post/PostsNavigationContents'
import TableOfContentsContents from '../components/Post/TableOfContentsContents'
import AsyncBlock from '../components/AsyncBlock'
import { postContext } from '../hooks/usePostContext'
import { queryClient } from '../utils/react-query'
import { useQuery } from '@tanstack/react-query'
export default function CategoryPostPage(props) {
  const { category, postFileName } = useParams()
  const { data: postsData } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchRepositoryPosts,
  })
  const path = category + '/' + postFileName
  const { data: contentsData } = useQuery({
    queryKey: ['posts', path],
    queryFn: () => fetchRepositoryFileContents({ path }),
  })

  const posts = Promise.resolve(postsData)
  const contents = Promise.resolve(contentsData)

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
    queryFn: () => fetchRepositoryFileContents({ path }),
  })
}
export async function loader({ params }) {
  return defer({
    contents: fetchPostContents(params),
    posts: fetchPosts(),
  })
}
