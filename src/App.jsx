import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import RootPage from './pages/Root'
import ErrorPage from './pages/Error'
import CategoryPostsPage, {
  loader as categoryPostsLoader,
} from './pages/CategoryPosts'
import ProloguePage, { loader as fetchPostsLoader } from './pages/Prologue'
import CategoryPostPage, {
  loader as fetchPostLoader,
} from './pages/CategoryPost'
import { store } from './store/store.js'

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
  return (
    <Provider store={store}>
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  )
}

export default App
