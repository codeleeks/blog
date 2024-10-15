import { useRef, useState } from 'react'

import { Outlet, RouterProvider, useNavigate } from 'react-router'
import { createBrowserRouter, NavLink } from 'react-router-dom'
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
              <NavLink to=''>posts</NavLink>
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

const routes = [
  {
    path: '/',
    element: <Root />,
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

export default function BlogRouterProvider({ children }) {
  return <RouterProvider router={router} />
}
