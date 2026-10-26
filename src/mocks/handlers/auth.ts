import { http, HttpResponse } from 'msw'

import { roles } from '../data/role'
import { userProfile, users } from '../data/user'
import type { LoginParams, LoginResult } from '@/types/user'
import type { UserInfo, UserRole } from '@/stores/user'

/**
 * 认证域 mock 接口（REST 规范，对齐后端未来接口）
 * - POST /api/auth/login   登录：校验账号密码，签发 token/userInfo/role/permissions
 * - 账号体系：admin 为系统管理员（对齐 userProfile 登录态展示）；其余走 users 数据池
 *   （user01/user08/user15/user22/user29 为管理员角色，user03 为运营专员，其余为普通用户）
 * - 权限：按账号角色编码查角色表，带出该角色的 menuIds 作为登录态权限
 * - 失败返回业务码（HTTP 200 + 非 0 code），不触发 request 层的 401 清理逻辑
 */

/** 演示密码（与 README / 登录页提示一致） */
const MOCK_PASSWORD = '123456'

/** 用户记录 → 登录态用户信息（UserRecord 超集字段裁剪为 UserInfo） */
function toUserInfo(user: (typeof users)[number]): UserInfo {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
  }
}

export const authHandlers = [
  /** POST /api/auth/login — 登录 */
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginParams
    const username = body.username?.trim()

    // 解析账号：admin 为系统管理员（独立账号），其余走 users 数据池
    let account: { userInfo: UserInfo; role: UserRole } | undefined
    if (username === 'admin') {
      account = { userInfo: userProfile, role: 'admin' }
    } else {
      const user = users.find((item) => item.username === username)
      if (user) account = { userInfo: toUserInfo(user), role: user.role }
    }

    // 账号不存在或密码错误：统一业务失败结构
    if (!account || body.password !== MOCK_PASSWORD) {
      return HttpResponse.json({ code: 1001, message: '用户名或密码错误', data: null })
    }

    // 按角色编码查角色表，带出权限点；角色缺失或已停用则拒绝登录
    const roleRecord = roles.find((item) => item.code === account.role)
    if (!roleRecord || roleRecord.status !== 'enabled') {
      return HttpResponse.json({
        code: 1002,
        message: '账号所属角色已被停用，请联系管理员',
        data: null,
      })
    }

    // 登录成功：签发 token（后续请求经拦截器携带 Authorization: Bearer <token>）
    const data: LoginResult = {
      token: `mock-token-${username}`,
      userInfo: account.userInfo,
      role: roleRecord.code,
      permissions: roleRecord.menuIds,
    }
    return HttpResponse.json({ code: 0, message: 'ok', data })
  }),
]
