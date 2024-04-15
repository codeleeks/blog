import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import RootPage from './pages/Root'
import Prologue, {
  loader as fetchPostsLoader,
} from './components/Prologue/Prologue'
import ErrorPage from './pages/Error'

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
      { index: true, element: <Prologue />, loader: fetchPostsLoader },
    ],
  },
])

function App() {
  return <RouterProvider router={router}></RouterProvider>
}

export default App
