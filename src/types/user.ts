import type { UserInfo, UserRole } from '@/stores/user'

/** 复用登录态类型（stores/user 导出；类型 re-export 无运行时依赖） */
export type { UserInfo, UserRole } from '@/stores/user'

/**
 * 用户域类型定义（业务页 / api 层 / mock 层共用，单一数据源）
 */

/** 用户启停状态 */
export type UserStatus = 'enabled' | 'disabled'

/** 用户记录（列表项 / 详情 / 编辑回显共用） */
export interface UserRecord {
  /** 用户唯一标识 */
  id: string
  /** 用户名（创建后不可修改） */
  username: string
  /** 昵称 */
  nickname: string
  /** 邮箱 */
  email: string
  /** 手机号 */
  phone: string
  /** 角色（菜单可见性 / 业务权限） */
  role: UserRole
  /** 启停状态 */
  status: UserStatus
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 更新时间（ISO 字符串，可选） */
  updatedAt?: string
  /** 备注（可选） */
  remark?: string
}

/** 用户列表查询条件 */
export interface UserQuery {
  /** 页码（从 1 开始） */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 关键字：用户名 / 昵称 / 邮箱 / 手机号模糊匹配 */
  keyword?: string
  /** 状态筛选（空字符串表示全部） */
  status?: UserStatus | ''
  /** 角色筛选（空字符串表示全部） */
  role?: UserRole | ''
}

/** 通用分页结果 */
export interface PageResult<T> {
  /** 当前页数据 */
  list: T[]
  /** 总条数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页条数 */
  pageSize: number
}

/** 创建用户请求体 */
export interface UserCreatePayload {
  username: string
  nickname: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  remark?: string
}

/** 更新用户请求体（username 不可改；其余字段均可选，传哪改哪） */
export type UserUpdatePayload = Partial<Omit<UserCreatePayload, 'username'>>

/** 批量删除请求体 */
export interface UserBatchDeletePayload {
  /** 待删除用户 id 列表 */
  ids: string[]
}

/** 启停切换请求体 */
export interface UserStatusPayload {
  status: UserStatus
}

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录结果（后端签发 token + 用户信息 + 角色 + 权限点，一次写入 userStore） */
export interface LoginResult {
  /** 登录凭证（后续请求经请求拦截器自动携带） */
  token: string
  /** 用户信息 */
  userInfo: UserInfo
  /** 角色编码（角色表 code） */
  role: UserRole
  /** 权限点 id 列表（来自所属角色的 menuIds，驱动菜单可见性与路由守卫） */
  permissions: string[]
}
