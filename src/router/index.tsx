/**
 * 注意路由文件必须要用tsx格式的
 * react组件只能在jsx或tsx文件里引用
 */
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import App from '../App'
import LoginPage from '@/pages/LoginPage/LoginPage'
import ErrorPage from '@/pages/ErrorPage/ErrorPage'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  }
]

const router = createBrowserRouter(routes, {
  basename: '/'
})

export default router
