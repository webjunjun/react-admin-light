/** 分页结果为各业务域通用结构，复用用户域定义 */
export type { PageResult } from '@/types/user'

/**
 * 角色域类型定义（业务页 / api 层 / mock 层共用，单一数据源）
 * 权限模型：角色 — 权限点（菜单 + 按钮）多对多
 * - 菜单节点 id 即路由 path（如 /system/users），驱动侧边菜单可见性与路由守卫
 * - 按钮节点 id 形如 '/system/users:create'，为操作级权限预留（本期只录入不拦截）
 * - 全部 id 全链路使用 string，避免 Tree key 数字/字符串混用
 */

/** 角色启停状态 */
export type RoleStatus = 'enabled' | 'disabled'

/** 权限节点类型：菜单 / 按钮 */
export type PermissionType = 'menu' | 'button'

/** 权限树节点（角色表单 Tree 勾选的数据源） */
export interface PermissionNode {
  /** 权限点 id：菜单为路由 path，按钮为 'path:action' */
  id: string
  /** 权限点名称 */
  name: string
  /** 节点类型 */
  type: PermissionType
  /** 子节点 */
  children?: PermissionNode[]
}

/** 角色记录（列表项 / 编辑回显共用） */
export interface RoleRecord {
  /** 角色唯一标识 */
  id: string
  /** 角色名称（如：系统管理员） */
  name: string
  /** 角色编码（如：admin，创建后不可修改；与 UserRecord.role 同体系） */
  code: string
  /** 启停状态 */
  status: RoleStatus
  /** 排序值（升序） */
  sort: number
  /** 备注（可选） */
  remark?: string
  /** 已授权权限点 id 列表（菜单 + 按钮） */
  menuIds: string[]
  /** 内置标记：内置角色不可删除 / 不可停用 */
  builtin: boolean
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 更新时间（ISO 字符串，可选） */
  updatedAt?: string
}

/** 角色列表查询条件 */
export interface RoleQuery {
  /** 页码（从 1 开始） */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 关键字：角色名称 / 编码模糊匹配 */
  keyword?: string
  /** 状态筛选（空字符串表示全部） */
  status?: RoleStatus | ''
}

/** 创建角色请求体 */
export interface RoleCreatePayload {
  name: string
  code: string
  status: RoleStatus
  sort: number
  remark?: string
  menuIds: string[]
}

/** 更新角色请求体（code 不可改；其余字段均可选，传哪改哪） */
export type RoleUpdatePayload = Partial<Omit<RoleCreatePayload, 'code'>>

/** 批量删除请求体 */
export interface RoleBatchDeletePayload {
  /** 待删除角色 id 列表 */
  ids: string[]
}

/** 启停切换请求体 */
export interface RoleStatusPayload {
  status: RoleStatus
}
