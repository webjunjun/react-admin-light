import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/css/reset.less'
// import App from './pages/home/home'
import LayoutIndex from '@/layouts'
// import reportWebVitals from './reportWebVitals'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <LayoutIndex />
  </React.StrictMode>
)

// reportWebVitals()
