import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

/**
 * MSW Service Worker（浏览器端网络拦截）
 * - 由 main.tsx 按 VITE_USE_MOCK 开关动态启用，仅开发环境开启
 * - 未匹配的请求（静态资源/HMR 等）直接放行，不干扰应用
 */
export const worker = setupWorker(...handlers)
