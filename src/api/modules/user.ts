import { request } from '@/api/request'
import type {
  PageResult,
  UserBatchDeletePayload,
  UserCreatePayload,
  UserQuery,
  UserRecord,
  UserStatus,
  UserStatusPayload,
  UserUpdatePayload,
} from '@/types/user'

/**
 * 用户域接口（REST 规范，url 写资源路径，baseURL 自动补 /api 前缀）
 * - GET    /users        分页 + 条件查询
 * - POST   /users        创建用户
 * - PUT    /users/:id    更新用户（username 不可改）
 * - PATCH  /users/:id/status  状态启停切换
 * - DELETE /users/:id    删除单个用户
 * - DELETE /users        批量删除（body: { ids }）
 */
export const userApi = {
  /** 用户列表（分页 + 关键字/状态/角色查询） */
  getUserList(params: UserQuery): Promise<PageResult<UserRecord>> {
    return request<PageResult<UserRecord>>({ url: '/users', method: 'get', params })
  },

  /** 创建用户 */
  createUser(data: UserCreatePayload): Promise<UserRecord> {
    return request<UserRecord>({ url: '/users', method: 'post', data })
  },

  /** 更新用户 */
  updateUser(id: string, data: UserUpdatePayload): Promise<UserRecord> {
    return request<UserRecord>({ url: `/users/${id}`, method: 'put', data })
  },

  /** 状态启停切换 */
  updateUserStatus(id: string, status: UserStatus): Promise<UserRecord> {
    const data: UserStatusPayload = { status }
    return request<UserRecord>({ url: `/users/${id}/status`, method: 'patch', data })
  },

  /** 删除单个用户 */
  deleteUser(id: string): Promise<null> {
    return request<null>({ url: `/users/${id}`, method: 'delete' })
  },

  /** 批量删除用户 */
  batchDeleteUsers(ids: string[]): Promise<{ removed: number }> {
    const data: UserBatchDeletePayload = { ids }
    return request<{ removed: number }>({ url: '/users', method: 'delete', data })
  },
}
