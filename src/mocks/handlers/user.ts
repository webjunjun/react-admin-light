import { http, HttpResponse } from 'msw'

import { userProfile, users } from '../data/user'
import type {
  PageResult,
  UserBatchDeletePayload,
  UserCreatePayload,
  UserRecord,
  UserStatusPayload,
  UserUpdatePayload,
} from '@/types/user'

/**
 * 用户域 mock 接口（REST 规范，对齐后端未来接口）
 * - 资源名复数：/api/users（集合）、/api/users/:id（单项）
 * - 动作语义用 HTTP 方法表达：GET 查询 / POST 创建 / PUT 更新 / DELETE 删除 / PATCH 部分更新
 * - 响应结构统一对齐前端 ApiResponse：{ code, message, data }
 * - 增删改直接操作 data/user.ts 的 users 内存数组，页面 CRUD 后刷新列表可见真实变化
 */

/** 关键字匹配：用户名 / 昵称 / 邮箱 / 手机号任一包含即命中 */
function matchKeyword(item: UserRecord, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return true
  return [item.username, item.nickname, item.email, item.phone].some((field) =>
    field.toLowerCase().includes(kw),
  )
}

export const userHandlers = [
  /** GET /api/users — 用户列表（分页 + 条件查询） */
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize')) || 10)
    const keyword = url.searchParams.get('keyword') ?? ''
    const status = url.searchParams.get('status') ?? ''
    const role = url.searchParams.get('role') ?? ''

    const filtered = users.filter((item) => {
      const statusOk = !status || item.status === status
      const roleOk = !role || item.role === role
      return statusOk && roleOk && matchKeyword(item, keyword)
    })

    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)
    const data: PageResult<UserRecord> = {
      list,
      total: filtered.length,
      page,
      pageSize,
    }
    return HttpResponse.json({ code: 0, message: 'ok', data })
  }),

  /** GET /api/users/:id — 用户详情 */
  http.get('/api/users/:id', ({ params }) => {
    const user = users.find((item) => item.id === params.id)
    if (!user) {
      return HttpResponse.json({ code: 404, message: '用户不存在', data: null }, { status: 404 })
    }
    return HttpResponse.json({ code: 0, message: 'ok', data: user })
  }),

  /** POST /api/users — 创建用户（用户名唯一性校验） */
  http.post('/api/users', async ({ request }) => {
    const body = (await request.json()) as UserCreatePayload
    const { username, ...rest } = body

    if (!username?.trim()) {
      return HttpResponse.json({ code: 400, message: '用户名不能为空', data: null }, { status: 400 })
    }
    if (users.some((item) => item.username === username.trim())) {
      return HttpResponse.json({ code: 400, message: '用户名已存在', data: null }, { status: 400 })
    }

    const now = new Date().toISOString()
    const user: UserRecord = {
      id: String(Date.now()),
      username: username.trim(),
      nickname: rest.nickname?.trim() || username.trim(),
      email: rest.email,
      phone: rest.phone,
      role: rest.role,
      status: rest.status,
      remark: rest.remark,
      createdAt: now,
      updatedAt: now,
    }
    users.unshift(user)
    return HttpResponse.json({ code: 0, message: 'ok', data: user }, { status: 201 })
  }),

  /** PUT /api/users/:id — 更新用户（username 不可改） */
  http.put('/api/users/:id', async ({ params, request }) => {
    const index = users.findIndex((item) => item.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ code: 404, message: '用户不存在', data: null }, { status: 404 })
    }
    const body = (await request.json()) as UserUpdatePayload
    const updated: UserRecord = {
      ...users[index],
      ...body,
      nickname: body.nickname?.trim() || users[index].nickname,
      updatedAt: new Date().toISOString(),
    }
    users[index] = updated
    return HttpResponse.json({ code: 0, message: 'ok', data: updated })
  }),

  /** PATCH /api/users/:id/status — 状态启停切换 */
  http.patch('/api/users/:id/status', async ({ params, request }) => {
    const index = users.findIndex((item) => item.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ code: 404, message: '用户不存在', data: null }, { status: 404 })
    }
    const body = (await request.json()) as UserStatusPayload
    if (body.status !== 'enabled' && body.status !== 'disabled') {
      return HttpResponse.json({ code: 400, message: '非法的状态值', data: null }, { status: 400 })
    }
    const updated: UserRecord = {
      ...users[index],
      status: body.status,
      updatedAt: new Date().toISOString(),
    }
    users[index] = updated
    return HttpResponse.json({ code: 0, message: 'ok', data: updated })
  }),

  /** DELETE /api/users/:id — 删除单个用户 */
  http.delete('/api/users/:id', ({ params }) => {
    const index = users.findIndex((item) => item.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ code: 404, message: '用户不存在', data: null }, { status: 404 })
    }
    users.splice(index, 1)
    return HttpResponse.json({ code: 0, message: 'ok', data: null })
  }),

  /** DELETE /api/users — 批量删除（body: { ids: string[] }） */
  http.delete('/api/users', async ({ request }) => {
    const body = (await request.json()) as UserBatchDeletePayload
    const ids = Array.isArray(body?.ids) ? body.ids : []
    if (ids.length === 0) {
      return HttpResponse.json({ code: 400, message: '未选择要删除的用户', data: null }, { status: 400 })
    }
    const remain = users.filter((item) => !ids.includes(item.id))
    const removed = users.length - remain.length
    users.splice(0, users.length, ...remain)
    return HttpResponse.json({ code: 0, message: 'ok', data: { removed } })
  }),

  /** GET /api/user/profile — 当前登录用户（需 Bearer token，验证拦截器自动携带） */
  http.get('/api/user/profile', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json({ code: 401, message: '未登录', data: null }, { status: 401 })
    }
    return HttpResponse.json({ code: 0, message: 'ok', data: userProfile })
  }),
]
