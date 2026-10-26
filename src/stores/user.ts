import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useTabsStore } from '@/stores/tabs'

/** 用户信息（字段按业务需要扩展） */
export interface UserInfo {
  /** 用户唯一标识 */
  id: string
  /** 用户名 */
  username: string
  /** 昵称（可选） */
  nickname?: string
  /** 头像地址（可选） */
  avatar?: string
}

/**
 * 角色编码：动态角色体系下即角色表中的 code（admin/user 为内置编码，
 * 角色管理中新建的自定义角色编码同样合法）
 */
export type UserRole = string

interface UserState {
  /** 登录凭证（未登录为 null） */
  token: string | null
  /** 当前用户信息（未登录为 null） */
  userInfo: UserInfo | null
  /** 当前角色编码（默认普通用户） */
  role: UserRole
  /** 当前角色拥有的权限点 id 列表（菜单 id=路由 path，驱动菜单可见性与路由守卫；按钮点预留） */
  permissions: string[]
  /** 存储 token */
  setToken: (token: string) => void
  /** 存储用户信息 */
  setUserInfo: (userInfo: UserInfo) => void
  /** 设置角色编码 */
  setRole: (role: UserRole) => void
  /** 设置权限点列表（登录时由角色 menuIds 写入） */
  setPermissions: (permissions: string[]) => void
  /** 清空用户信息（token + userInfo + 权限一并清空，角色重置为普通用户） */
  clearUserInfo: () => void
}

/**
 * 用户状态 Store（仅存储能力）
 * - 持久化：persist 中间件，自动同步到 localStorage（key: user-storage）
 * - 不联动登录逻辑、不做路由跳转，只负责状态存取
 */
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      role: 'user',
      permissions: [],

      setToken: (token) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      setRole: (role) => set({ role }),
      setPermissions: (permissions) => set({ permissions }),
      // 登出：清空全部页签（多标签页缓存系统联动），token/userInfo/角色/权限一并重置
      clearUserInfo: () => {
        useTabsStore.getState().clearTabs()
        set({ token: null, userInfo: null, role: 'user', permissions: [] })
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
