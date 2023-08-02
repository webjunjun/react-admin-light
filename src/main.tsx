import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import App from './App'

// 全局样式放到最外层的组件下面
import { GlobalStyle } from '@/style/global'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={ store }>
      <App />
    </Provider>
    <GlobalStyle />
  </React.StrictMode>,
)
