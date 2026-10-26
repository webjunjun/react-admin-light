import type { RoleRecord } from '@/types/role'

import { flattenPermissionIds, permissionTree } from './permission'

/**
 * 角色域 mock 数据模板
 * - roles 为内存 mock 数据库：handlers 的增删改直接操作此数组，页面 CRUD 真实生效
 * - 内置角色 admin/user 与登录账号体系（auth mock / 用户数据池的 role 字段）对齐
 * - 登录时 auth handler 按 code 查本表，带出 menuIds 作为登录态权限
 */

/** 基准创建时间 */
const BASE_TIME = '2025-01-01T09:00:00+08:00'

/** 角色列表（内存 mock 数据库） */
export const roles: RoleRecord[] = [
  {
    id: '1',
    name: '系统管理员',
    code: 'admin',
    status: 'enabled',
    sort: 1,
    builtin: true,
    menuIds: flattenPermissionIds(permissionTree),
    remark: '内置超级管理员，默认拥有全部权限',
    createdAt: BASE_TIME,
  },
  {
    id: '2',
    name: '普通用户',
    code: 'user',
    status: 'enabled',
    sort: 2,
    builtin: true,
    menuIds: ['/', '/system/settings'],
    remark: '内置普通角色，仅基础菜单权限',
    createdAt: BASE_TIME,
  },
  {
    id: '3',
    name: '运营专员',
    code: 'ops',
    status: 'enabled',
    sort: 3,
    builtin: false,
    // 仅有用户管理菜单访问权，无任何按钮操作点（用于演示 RBAC 菜单差异）
    menuIds: ['/', '/system/users'],
    remark: '自定义角色示例：可查看用户管理，无操作权限',
    createdAt: '2025-01-05T09:00:00+08:00',
  },
]
