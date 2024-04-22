import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import RootPage from './pages/Root'
import ErrorPage from './pages/Error'
import CategoryPostsPage, {
  loader as categoryPostsLoader,
} from './pages/CategoryPosts'
import ProloguePage, { loader as fetchPostsLoader } from './pages/Prologue'
import CategoryPostPage, {
  loader as fetchPostLoader,
} from './pages/CategoryPost'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={import.meta.env.BASE_URL} />,
  },
  {
    path: import.meta.env.BASE_URL,
    element: <RootPage />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <ProloguePage />, loader: fetchPostsLoader },
      {
        path: ':category',
        children: [
          {
            index: true,
            element: <CategoryPostsPage />,
            loader: categoryPostsLoader,
          },
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
  return <RouterProvider router={router}></RouterProvider>
}

export default App
