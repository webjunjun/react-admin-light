import { http, HttpResponse } from 'msw'

import { permissionTree } from '../data/permission'
import { roles } from '../data/role'
import { users } from '../data/user'
import type {
  PageResult,
  RoleBatchDeletePayload,
  RoleCreatePayload,
  RoleRecord,
  RoleStatusPayload,
  RoleUpdatePayload,
} from '@/types/role'

/**
 * 角色域 mock 接口（REST 规范，对齐后端未来接口）
 * - GET    /api/roles             分页 + 条件查询
 * - GET    /api/roles/all         全部启用角色（下拉选项）
 * - GET    /api/permissions/menus 权限树（菜单 + 按钮权限点）
 * - POST   /api/roles             创建角色（编码唯一校验）
 * - PUT    /api/roles/:id         更新角色（code 不可改）
 * - PATCH  /api/roles/:id/status  状态启停（内置角色禁止停用）
 * - DELETE /api/roles/:id         删除单个（内置 / 仍被用户引用时禁止）
 * - DELETE /api/roles             批量删除（body: { ids }，逐个过保护校验）
 * 业务失败统一 HTTP 200 + 非 0 code，保证错误信息经 request 层全局提示给用户
 */

/** 业务失败响应（HTTP 200 + 业务码，提示信息会透传到全局 message） */
function businessFail(message: string, code = 400) {
  return HttpResponse.json({ code, message, data: null })
}

/** 关键字匹配：角色名称 / 编码任一包含即命中 */
function matchKeyword(item: RoleRecord, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return true
  return [item.name, item.code].some((field) => field.toLowerCase().includes(kw))
}

/** 列表排序：sort 升序，同级按创建时间倒序（新建角色排前） */
function sortRoles(list: RoleRecord[]): RoleRecord[] {
  return [...list].sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export const roleHandlers = [
  /** GET /api/roles — 角色列表（分页 + 条件查询） */
  http.get('/api/roles', ({ request }) => {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize')) || 10)
    const keyword = url.searchParams.get('keyword') ?? ''
    const status = url.searchParams.get('status') ?? ''

    const filtered = roles.filter((item) => {
      const statusOk = !status || item.status === status
      return statusOk && matchKeyword(item, keyword)
    })
    const sorted = sortRoles(filtered)

    const start = (page - 1) * pageSize
    const list = sorted.slice(start, start + pageSize)
    const data: PageResult<RoleRecord> = {
      list,
      total: sorted.length,
      page,
      pageSize,
    }
    return HttpResponse.json({ code: 0, message: 'ok', data })
  }),

  /** GET /api/roles/all — 全部启用角色（用户表单角色下拉等场景使用） */
  http.get('/api/roles/all', () => {
    const list = sortRoles(roles.filter((item) => item.status === 'enabled'))
    return HttpResponse.json({ code: 0, message: 'ok', data: list })
  }),

  /** GET /api/permissions/menus — 权限树 */
  http.get('/api/permissions/menus', () => {
    return HttpResponse.json({ code: 0, message: 'ok', data: permissionTree })
  }),

  /** POST /api/roles — 创建角色（编码唯一校验） */
  http.post('/api/roles', async ({ request }) => {
    const body = (await request.json()) as RoleCreatePayload
    const code = body.code?.trim()
    const name = body.name?.trim()

    if (!name) return businessFail('角色名称不能为空')
    if (!code) return businessFail('角色编码不能为空')
    if (!/^[a-z][a-z0-9_-]{1,31}$/.test(code)) {
      return businessFail('角色编码需以小写字母开头，仅含小写字母、数字、下划线、短横线，2-32 位')
    }
    if (roles.some((item) => item.code === code)) {
      return businessFail('角色编码已存在')
    }

    const now = new Date().toISOString()
    const role: RoleRecord = {
      id: String(Date.now()),
      name,
      code,
      status: body.status === 'disabled' ? 'disabled' : 'enabled',
      sort: Number.isFinite(body.sort) ? body.sort : 0,
      remark: body.remark?.trim() || undefined,
      menuIds: Array.isArray(body.menuIds) ? body.menuIds : [],
      builtin: false,
      createdAt: now,
      updatedAt: now,
    }
    roles.push(role)
    return HttpResponse.json({ code: 0, message: 'ok', data: role })
  }),

  /** PUT /api/roles/:id — 更新角色（code 不可改，请求体中即便携带也忽略） */
  http.put('/api/roles/:id', async ({ params, request }) => {
    const index = roles.findIndex((item) => item.id === params.id)
    if (index === -1) return businessFail('角色不存在', 404)

    const body = (await request.json()) as RoleUpdatePayload
    const updated: RoleRecord = {
      ...roles[index],
      ...body,
      name: body.name?.trim() || roles[index].name,
      remark: body.remark?.trim() || undefined,
      menuIds: Array.isArray(body.menuIds) ? body.menuIds : roles[index].menuIds,
      updatedAt: new Date().toISOString(),
    }
    roles[index] = updated
    return HttpResponse.json({ code: 0, message: 'ok', data: updated })
  }),

  /** PATCH /api/roles/:id/status — 状态启停切换（内置角色禁止停用） */
  http.patch('/api/roles/:id/status', async ({ params, request }) => {
    const role = roles.find((item) => item.id === params.id)
    if (!role) return businessFail('角色不存在', 404)

    const body = (await request.json()) as RoleStatusPayload
    if (body.status !== 'enabled' && body.status !== 'disabled') {
      return businessFail('非法的状态值')
    }
    if (role.builtin && body.status === 'disabled') {
      return businessFail(`内置角色「${role.name}」不可停用`)
    }

    role.status = body.status
    role.updatedAt = new Date().toISOString()
    return HttpResponse.json({ code: 0, message: 'ok', data: role })
  }),

  /** DELETE /api/roles/:id — 删除单个角色（保护校验） */
  http.delete('/api/roles/:id', ({ params }) => {
    const role = roles.find((item) => item.id === params.id)
    if (!role) return businessFail('角色不存在', 404)

    if (role.builtin) return businessFail(`内置角色「${role.name}」不可删除`)
    const usingCount = users.filter((user) => user.role === role.code).length
    if (usingCount > 0) {
      return businessFail(`仍有 ${usingCount} 个用户属于角色「${role.name}」，请先调整后再删除`)
    }

    const index = roles.findIndex((item) => item.id === params.id)
    roles.splice(index, 1)
    return HttpResponse.json({ code: 0, message: 'ok', data: null })
  }),

  /** DELETE /api/roles — 批量删除（任一角色不允许删除则整批中止） */
  http.delete('/api/roles', async ({ request }) => {
    const body = (await request.json()) as RoleBatchDeletePayload
    const ids = Array.isArray(body?.ids) ? body.ids : []
    if (ids.length === 0) return businessFail('未选择要删除的角色')

    // 先统一校验，再执行删除，避免部分删除导致数据状态不一致
    for (const id of ids) {
      const role = roles.find((item) => item.id === id)
      if (!role) return businessFail('角色不存在', 404)
      if (role.builtin) return businessFail(`内置角色「${role.name}」不可删除`)
      const usingCount = users.filter((user) => user.role === role.code).length
      if (usingCount > 0) {
        return businessFail(`仍有 ${usingCount} 个用户属于角色「${role.name}」，请先调整后再删除`)
      }
    }

    const remain = roles.filter((item) => !ids.includes(item.id))
    const removed = roles.length - remain.length
    roles.splice(0, roles.length, ...remain)
    return HttpResponse.json({ code: 0, message: 'ok', data: { removed } })
  }),
]
