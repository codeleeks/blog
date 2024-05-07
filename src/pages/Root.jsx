import { Outlet } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'

export default function RootPage() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
        <Footer />
      </main>
      <ScrollToTop />
    </>
  )
}
