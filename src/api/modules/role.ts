import { request } from '@/api/request'
import type {
  PageResult,
  PermissionNode,
  RoleBatchDeletePayload,
  RoleCreatePayload,
  RoleQuery,
  RoleRecord,
  RoleStatus,
  RoleStatusPayload,
  RoleUpdatePayload,
} from '@/types/role'

/**
 * 角色域接口（REST 规范，url 写资源路径，baseURL 自动补 /api 前缀）
 * - GET    /roles        分页 + 条件查询
 * - GET    /roles/all    全部启用角色（下拉选项）
 * - POST   /roles        创建角色（编码唯一校验）
 * - PUT    /roles/:id    更新角色（code 不可改）
 * - PATCH  /roles/:id/status  状态启停切换
 * - DELETE /roles/:id    删除单个
 * - DELETE /roles        批量删除（body: { ids }）
 */
export const roleApi = {
  /** 角色列表（分页 + 关键字/状态查询） */
  getRoleList(params: RoleQuery): Promise<PageResult<RoleRecord>> {
    return request<PageResult<RoleRecord>>({ url: '/roles', method: 'get', params })
  },

  /** 全部启用角色（角色下拉选项） */
  getAllRoles(): Promise<RoleRecord[]> {
    return request<RoleRecord[]>({ url: '/roles/all', method: 'get' })
  },

  /** 创建角色 */
  createRole(data: RoleCreatePayload): Promise<RoleRecord> {
    return request<RoleRecord>({ url: '/roles', method: 'post', data })
  },

  /** 更新角色（code 不可改） */
  updateRole(id: string, data: RoleUpdatePayload): Promise<RoleRecord> {
    return request<RoleRecord>({ url: `/roles/${id}`, method: 'put', data })
  },

  /** 状态启停切换 */
  updateRoleStatus(id: string, status: RoleStatus): Promise<RoleRecord> {
    const data: RoleStatusPayload = { status }
    return request<RoleRecord>({ url: `/roles/${id}/status`, method: 'patch', data })
  },

  /** 删除单个角色 */
  deleteRole(id: string): Promise<null> {
    return request<null>({ url: `/roles/${id}`, method: 'delete' })
  },

  /** 批量删除角色 */
  batchDeleteRoles(ids: string[]): Promise<{ removed: number }> {
    const data: RoleBatchDeletePayload = { ids }
    return request<{ removed: number }>({ url: '/roles', method: 'delete', data })
  },
}

/** 权限域接口 */
export const permissionApi = {
  /** 权限树（菜单 + 按钮权限点，角色授权弹窗数据源） */
  getMenuTree(): Promise<PermissionNode[]> {
    return request<PermissionNode[]>({ url: '/permissions/menus', method: 'get' })
  },
}
