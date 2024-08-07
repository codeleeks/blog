import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import RootPage from '../pages/Root'
import ErrorPage from '../pages/Error'
import ProloguePage, { loader as fetchPostsLoader } from '../pages/Prologue'
import CategoryPostPage, {
  loader as fetchPostLoader,
} from '../pages/CategoryPost'
import NotFoundPage from '../pages/NotFoundPage'
import SnippetsPage, { loader as fetchSnippetsLoader } from '../pages/Snippets'
import SnippetPage, { loader as fetchSnippetLoader } from '../pages/Snippet'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={import.meta.env.BASE_URL} />,
    errorElement: <NotFoundPage />,
  },
  {
    path: import.meta.env.BASE_URL,
    element: <RootPage />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <ProloguePage />, loader: fetchPostsLoader },
      {
        path: 'posts',
        children: [
          {
            path: '*',
            element: <CategoryPostPage />,
            loader: fetchPostLoader,
          },
        ],
      },
      {
        path: 'snippets',
        children: [
          {
            index: true,
            element: <SnippetsPage />,
            loader: fetchSnippetsLoader,
          },
          {
            path: ':category/:snippetFileName',
            element: <SnippetPage />,
            loader: fetchSnippetLoader,
          },
        ],
      },
    ],
  },
])

const MainRouteProvider = () => {
  return <RouterProvider router={router}></RouterProvider>
}

export default MainRouteProvider