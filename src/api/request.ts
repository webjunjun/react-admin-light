import axios from 'axios'
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import { useUserStore } from '@/stores/user'

/**
 * 扩展 Axios 配置：silent 请求出错时不触发全局错误提示
 * 用法：request({ url, silent: true })
 */
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 静默请求：出错时不弹全局错误提示（仅 reject） */
    silent?: boolean
  }
}

/** 统一后端响应结构（按实际后端约定调整） */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 业务成功状态码（常见 0 / 200，按后端约定调整） */
export const SUCCESS_CODE = 0

/** 业务未登录状态码（常见 401 / 1001，按后端约定调整） */
export const UNAUTHORIZED_CODE = 401

/**
 * 全局错误提示
 * 默认 console 输出；接入 UI 组件库后注入，例如：
 * setNotifyError((msg) => message.error(msg))
 */
let notifyError: (message: string) => void = (message) => {
  console.error(`[api] ${message}`)
}

export function setNotifyError(handler: (message: string) => void): void {
  notifyError = handler
}

/**
 * 从响应头 Content-Disposition 解析文件名
 * 优先 RFC 5987 filename*（UTF-8 编码），回退传统 filename 字段，再回退 fallback
 */
export function getFileNameFromDisposition(
  disposition: string | undefined,
  fallback = 'download',
): string {
  if (!disposition) return fallback

  // filename*=UTF-8''%E5%AF%BC%E5%87%BA.pdf（推荐格式）
  const star = disposition.match(/filename\*\s*=\s*(?:UTF-8|utf-8)?''([^;]+)/i)
  if (star?.[1]) {
    try {
      const name = decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''))
      if (name) return name
    } catch {
      /* 解码失败，回退 filename 字段 */
    }
  }

  // filename="export.pdf"（传统格式）
  const plain = disposition.match(/filename\s*=\s*"?([^";]+)"?/i)
  if (plain?.[1]) return plain[1].trim()

  return fallback
}

/**
 * Axios 实例（底层请求能力）
 * - baseURL：统一来自环境变量 VITE_API_BASE_URL（.env.development / .env.production）
 * - timeout：统一来自环境变量 VITE_API_TIMEOUT（毫秒，缺省 15000）
 */
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
})

/** 请求拦截器：自动携带 token（Bearer） */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token } = useUserStore.getState()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

/**
 * 响应拦截器：业务状态码处理 + 统一错误提示 + 全局异常捕获
 */
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // blob 文件流：直接返回完整响应（供 downloadFile 读取 headers 与文件名）
    if (response.config.responseType === 'blob') {
      return response
    }

    const res = response.data as ApiResponse

    // 业务成功：解包，直接返回 data（业务层少一层取值）
    // 类型断言：axios 拦截器类型要求返回 AxiosResponse，运行时实际返回业务数据，
    // 类型安全由 request<T> 泛型 facade 保证
    if (res.code === SUCCESS_CODE) {
      return res.data as unknown as AxiosResponse
    }

    // 业务失败：统一错误提示（silent 除外）
    const message = res.message || '请求失败'
    if (!response.config.silent) notifyError(message)

    // 业务层未登录：清空本地登录态（路由守卫自动跳转 /login）
    if (res.code === UNAUTHORIZED_CODE) {
      useUserStore.getState().clearUserInfo()
    }
    return Promise.reject(new Error(message))
  },
  (error: AxiosError) => {
    // 全局异常捕获：超时 / 网络异常 / HTTP 状态码统一处理
    const { config } = error
    // 下方分支对所有路径均会赋值（末位 else 兜底），无需初值
    let message: string

    // axios 超时错误码：旧版 ECONNABORTED / 新版 ETIMEDOUT，均需识别
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      message = '请求超时，请稍后重试'
    } else if (!error.response) {
      message = '网络异常，请检查网络连接'
    } else {
      const status = error.response.status
      if (status === 401) {
        message = '登录已失效，请重新登录'
        useUserStore.getState().clearUserInfo()
      } else if (status === 403) {
        message = '没有权限执行该操作'
      } else if (status === 404) {
        message = '请求的资源不存在'
      } else if (status >= 500) {
        message = '服务器异常，请稍后重试'
      } else {
        message = `请求失败（HTTP ${status}）`
      }
    }

    if (!config?.silent) notifyError(message)
    return Promise.reject(error)
  },
)

/** 触发浏览器下载：创建临时 <a> 并自动点击 */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface DownloadFileOptions extends Omit<AxiosRequestConfig, 'responseType'> {
  /** 自定义文件名（缺省时自动从 Content-Disposition 解析） */
  filename?: string
}

/**
 * 文件流下载（专门封装 blob，支持后端文件导出）
 * - 支持 GET / POST 等任意方法（method / data / params 控制）
 * - 文件名优先级：filename 参数 > Content-Disposition 解析 > 'download'
 * - 后端导出失败返回 JSON 错误时（HTTP 200 + application/json），自动解析并 reject
 * 用法：await downloadFile('/report/export', { method: 'post', data: { id: 1 } })
 */
export async function downloadFile(
  url: string,
  options: DownloadFileOptions = {},
): Promise<string> {
  const { filename: customName, method = 'get', data, params, ...config } = options

  const response = await service.request<Blob>({
    url,
    method,
    data,
    params,
    ...config,
    responseType: 'blob',
  })

  const blob = response.data

  // 导出失败时后端常返回 JSON 错误（Content-Type: application/json）
  const contentType = String(response.headers['content-type'] ?? '')
  if (contentType.includes('application/json') || blob.type.includes('json')) {
    const text = await blob.text()
    let parsed: { message?: string } | null = null
    try {
      parsed = JSON.parse(text)
    } catch {
      // 响应体不是 JSON：保持 null，按正常文件流继续处理
    }
    if (parsed) {
      const message = parsed.message || '导出失败'
      if (!response.config.silent) notifyError(message)
      return Promise.reject(new Error(message))
    }
  }

  const filename =
    customName ?? getFileNameFromDisposition(String(response.headers['content-disposition'] ?? ''))

  saveBlob(blob, filename)
  return filename
}

/**
 * 类型化请求方法（响应拦截器已解包，泛型 T 即业务数据结构）
 * 用法：const data = await request<UserInfo>({ url: '/user/info', method: 'get' })
 * 需要原始响应（如自定义 responseType）时可用导出的 service 实例
 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config) as Promise<T>
}

export { service }
