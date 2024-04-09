import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Date from './components/UI/Date'
import RootPage from './pages/Root'
import Prologue from './components/Prologue'

const router = createBrowserRouter([
  {
    path: import.meta.env.BASE_URL,
    element: <RootPage />,
    children: [{ index: true, element: <Prologue /> }],
  },
])

function App() {
  return (
    <RouterProvider router={router}>
      <Date dateTime='2022-06-12' />
    </RouterProvider>
  )
}

export default App
