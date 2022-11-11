import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/css/reset.less'
import LayoutIndex from '@/layouts'
import Home from '@/pages/home/home'
import List from '@/pages/list/list'
// import reportWebVitals from './reportWebVitals'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  // 通过在应用入口添加BrowserRouter 组件开启路由功能
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LayoutIndex />}>
          <Route index element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/list" element={<List />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

// reportWebVitals()
