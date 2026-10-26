import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import { setNotifyError } from '@/api/request'
// 使用 @ 别名引入，验证路径别名在运行时生效
import { router } from '@/router'
// 全局样式重置（浏览器默认样式兜底）
import '@/styles/reset.css'

/**
 * 全局错误提示桥接：将 request 层的统一错误回调接入 antd message
 * （request.ts 预留 setNotifyError 注入位，默认 console 输出）
 */
function NotifyBridge() {
  const { message } = AntdApp.useApp()
  useEffect(() => {
    setNotifyError((msg) => {
      void message.error(msg)
    })
    return () => setNotifyError((msg) => console.error(`[api] ${msg}`))
  }, [message])
  return null
}

/**
 * 注意：不使用 <React.StrictMode />
 * keepalive-for-react 官方要求：StrictMode 在开发模式与其不兼容，
 * 会导致缓存组件双重挂载等意外行为（React 19.2+ 需 keepalive-for-react@5.x）
 */

/**
 * MSW Mock 开关（业务代码零改动）
 * - VITE_USE_MOCK === 'true' 时才启用（开发环境默认开启）
 * - 生产环境 .env.production 为 false，此函数直接返回，mock 代码不打包
 */
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({
    // 未被 mock 覆盖的请求（静态资源 / HMR 等）直接放行
    onUnhandledRequest: 'bypass',
  })
}

// 等待 Mock 就绪后再挂载应用，避免首屏请求穿透
enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <NotifyBridge />
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>,
  )
})
