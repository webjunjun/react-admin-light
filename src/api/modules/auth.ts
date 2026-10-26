import { request } from '@/api/request'
import type { LoginParams, LoginResult } from '@/types/user'

/**
 * 认证域接口（REST 规范，url 写资源路径，baseURL 自动补 /api 前缀）
 * - POST /auth/login   登录：校验账号密码，签发 token + 用户信息 + 角色
 */
export const authApi = {
  /** 登录 */
  login(data: LoginParams): Promise<LoginResult> {
    return request<LoginResult>({ url: '/auth/login', method: 'post', data })
  },
}
