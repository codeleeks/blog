import { useRef, useState } from 'react'

import {
  isRouteErrorResponse,
  Navigate,
  Outlet,
  RouterProvider,
  useNavigate,
} from 'react-router'
import { createBrowserRouter, Link, NavLink } from 'react-router-dom'
import AvatarImg from './assets/avatar.png'
import Post from './pages/Post'
import {
  postContentsLoader,
  postsLoader,
  snippetContentsLoader,
  snippetsLoader,
} from './fetch'
import Prologue from './pages/Prologue'
import Snippets from './pages/Snippets'
import Snippet from './pages/Snippet'
import ErrorBlock from './components/ErrorBlock'

const Root = () => {
  const ref = useRef(null)
  const [toggled, setToggled] = useState(false)
  const navigate = useNavigate()

  const toggler = () => {
    ref.current.classList.toggle('toggled')
    document.body.classList.toggle('toggled')
    setToggled((prev) => !prev)
  }

  const backToHome = () => {
    ref.current.classList.remove('toggled')
    document.body.classList.remove('toggled')
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className='header' ref={ref}>
        <div className='header-left'>
          <img
            className='header-left__avatar'
            src={AvatarImg}
            alt='avatar image'
          />
          <h1 className='header-left__title' onClick={backToHome}>
            silverbullet
          </h1>
        </div>
        <div className='header-right'>
          <div className='header-right__menu-bg'></div>
          <div className='header-right__menu-toggler'>
            <div
              className='header-right__menu-toggler__icon material-icons'
              onClick={toggler}
            >
              {toggled ? 'close' : 'menu'}
            </div>
          </div>
          <ul className='header-right__links'>
            <li className='header-right__links-posts'>
              <NavLink to='posts'>posts</NavLink>
            </li>
            <li className='header-right__links-snippets'>
              <NavLink to='snippets'>snippets</NavLink>
            </li>
          </ul>
        </div>
      </header>
      <main className='main'>
        <Outlet />
      </main>
      <footer className='footer'>designed by codeleeks</footer>
    </>
  )
}

const NotFoundPage = (props) => {
  const title = 'Not found!'
  const message = 'Could not find resource or page.'

  return (
    <>
      <ErrorBlock title={title} message={message} />
      <Link to={process.env.BLOG_BASE_URL}>홈으로 돌아가기</Link>
    </>
  )
}

const ErrorPage = (props) => {
  const error = useRouteError()
  let title = 'Error occurred!'
  let message = 'something went wrong'

  if (isRouteErrorResponse(error) && error.status === 500) {
    message = error.data.message
  }
  return <ErrorBlock title={title} message={message} />
}

const routes = [
  {
    path: '/',
    element: <Navigate to={process.env.BLOG_BASE_URL} />,
    errorElement: <NotFoundPage />,
  },
  {
    path: process.env.BLOG_BASE_URL,
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to='posts' />,
      },
      {
        path: 'posts',
        children: [
          {
            index: true,
            element: <Prologue />,
            loader: postsLoader,
          },
          {
            path: 'posts/*',
            element: <Post />,
            loader: postContentsLoader,
          },
        ],
      },
      {
        path: 'snippets',
        children: [
          {
            index: true,
            element: <Snippets />,
            loader: snippetsLoader,
          },
          {
            path: 'snippets/*',
            element: <Snippet />,
            loader: snippetContentsLoader,
          },
        ],
      },
    ],
  },
]

const router = createBrowserRouter(routes)

export default function BlogRouterProvider() {
  return <RouterProvider router={router} />
}
