import type { UserInfo } from '@/stores/user'
import type { UserRecord, UserRole, UserStatus } from '@/types/user'

/**
 * 用户域 mock 数据模板
 * - userProfile 结构对齐 UserInfo（登录态）
 * - users 为内存 mock 数据库：handlers 的增删改直接操作此数组（splice/push/filter），
 *   保证页面 CRUD 后刷新列表能看到真实变化
 */

/** 当前登录用户 */
export const userProfile: UserInfo = {
  id: '1',
  username: 'admin',
  nickname: '演示用户',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=admin',
}

/** 用户名池（确定性生成，保证每次 dev 启动数据一致） */
const usernamePool = Array.from({ length: 35 }, (_, i) => `user${String(i + 1).padStart(2, '0')}`)

/** 角色分配：user01 / user08 / user15 / user22 / user29 为管理员；user03 为运营专员（自定义角色示例） */
function roleOf(index: number): UserRole {
  if (index === 2) return 'ops'
  return (index + 1) % 7 === 1 ? 'admin' : 'user'
}

/** 状态分配：每 5 条有 1 条停用（id 5 / 10 / 15 ...） */
function statusOf(index: number): UserStatus {
  return (index + 1) % 5 === 0 ? 'disabled' : 'enabled'
}

/** 创建时间：2025-01-01 起每天新增一条，格式 ISO 字符串 */
function createdAtOf(index: number): string {
  const base = new Date('2025-01-01T09:00:00+08:00')
  base.setDate(base.getDate() + index)
  return base.toISOString()
}

/** 手机号：138 号段 + 8 位序号补零 */
function phoneOf(index: number): string {
  return `138${String(index + 1).padStart(8, '0')}`
}

/** 用户列表（内存 mock 数据库） */
export const users: UserRecord[] = usernamePool.map((username, index) => {
  const id = String(index + 1)
  return {
    id,
    username,
    nickname: `${username === 'user01' ? '管理员' : '用户'}${id}`,
    email: `${username}@example.com`,
    phone: phoneOf(index),
    role: roleOf(index),
    status: statusOf(index),
    createdAt: createdAtOf(index),
    remark: index % 9 === 0 ? '示例备注' : undefined,
  }
})
