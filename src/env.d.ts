/// <reference types="vite/client" />

// .env.development / .env.production 环境变量的类型声明
// 新增 VITE_ 前缀变量时，在此处补充类型以获得编辑器提示
interface ImportMetaEnv {
  /** 应用标题 */
  readonly VITE_APP_TITLE: string
  /** API 基础地址（axios baseURL） */
  readonly VITE_API_BASE_URL: string
  /** 接口超时时间（毫秒），缺省 15000 */
  readonly VITE_API_TIMEOUT?: string
  /** 是否启用 MSW Mock（'true' 开启；开发默认开启，生产关闭） */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
