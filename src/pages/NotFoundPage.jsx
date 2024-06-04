import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import ScrollToTop from '../components/ScrollToTop'
import ErrorBlock from '../components/UI/ErrorBlock'

export default function NotFoundPage() {
  const title = 'Not found!'
  const message = 'Could not find resource or page.'

  return (
    <>
      <Header />
      <main>
        <ErrorBlock title={title} message={message} />
        <Footer />
      </main>
      <ScrollToTop />
    </>
  )
}
