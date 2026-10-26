import { authHandlers } from './auth'
import { roleHandlers } from './role'
import { userHandlers } from './user'

/**
 * 聚合所有 mock 接口 handlers
 * 新增业务域：在 handlers/ 下新建 <domain>.ts，导出 handlers 数组并在此追加
 */
export const handlers = [...authHandlers, ...userHandlers, ...roleHandlers]
