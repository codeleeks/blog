import MainRouteProvider from './routes/Routes'
import ReactQueryProvider from './utils/react-query'

function App() {
  return (
    <ReactQueryProvider>
      <MainRouteProvider />
    </ReactQueryProvider>
  )
}

export default App
