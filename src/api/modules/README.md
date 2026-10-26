# 业务接口模块（预留分层）

每个业务域一个文件，文件内只导出接口函数，统一调用 `@/api/request` 的 `request` / `downloadFile`。
新增业务接口时在此目录建文件，禁止在页面/组件中直接 new axios。

示例：

```ts
// modules/user.ts
import { downloadFile, request } from '@/api/request'
import type { UserInfo } from '@/stores/user'

/** 获取当前用户信息（url 写资源路径，baseURL 自动补 /api 前缀） */
export function getUserInfo() {
  return request<UserInfo>({ url: '/user/profile', method: 'get' })
}

/** 导出报表（文件流下载，自动解析文件名） */
export function exportReport(params: { id: string }) {
  return downloadFile('/report/export', { method: 'post', data: params })
}
```

> URL 约定：`VITE_API_BASE_URL` 已含 `/api` 前缀，接口 url 写资源路径（如 `/users/1`），
> 实际请求为 `/api/users/1`，与 MSW mock handler（`src/mocks/handlers`）的完整路径对齐。
> 禁止在 url 中重复写 `/api`，否则会拼成 `/api/api/...`。
