import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import Date from './components/UI/Date'
import RootPage from './pages/Root'
import Prologue from './components/Prologue/Prologue'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={import.meta.env.BASE_URL}/>
  },
  {
    path: import.meta.env.BASE_URL,
    element: <RootPage />,
    children: [{ index: true, element: <Prologue /> }],
  },
])

function App() {
  return <RouterProvider router={router}></RouterProvider>
}

export default App
