import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.scss'

import BlogRouterProvider from './Routes'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BlogRouterProvider />
  </React.StrictMode>
)
