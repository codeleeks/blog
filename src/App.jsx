import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import RootPage from './pages/Root'
import ErrorPage from './pages/Error'
import ProloguePage, { loader as fetchPostsLoader } from './pages/Prologue'
import CategoryPostPage, {
  loader as fetchPostLoader,
} from './pages/CategoryPost'
import ReactQueryProvider from './utils/react-query'
import NotFoundPage from './pages/NotFoundPage'

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
        path: 'posts/:category',
        children: [
          {
            path: ':postFileName',
            element: <CategoryPostPage />,
            loader: fetchPostLoader,
          },
        ],
      },
    ],
  },
])

function App() {
  return (
    <ReactQueryProvider>
      <RouterProvider router={router}></RouterProvider>
    </ReactQueryProvider>
  )
}

export default App
