import {
  DashboardOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

/**
 * 菜单注册表（布局侧边菜单的静态元数据：图标 / 名称 / 层级）
 * - 与路由表 path 一一对应，key 即路由路径（Menu onClick 直接 navigate(key)）
 * - 可见性不再由静态角色白名单决定：运行时按登录态 permissions（角色 menuIds）过滤，
 *   权限点 id 与菜单 key 相同（菜单节点 id = 路由 path）
 * - 新增页面时三处同步：路由表、本注册表、mocks/data/permission.ts 权限树
 */
export interface AppMenu {
  /** 路由路径（唯一，同时是权限树菜单节点 id） */
  key: string
  /** 菜单名称 */
  label: string
  /** 图标（可选） */
  icon?: ReactNode
  /** 子菜单 */
  children?: AppMenu[]
}

/** 应用菜单注册表 */
export const appMenus: AppMenu[] = [
  {
    key: '/',
    label: '工作台',
    icon: <DashboardOutlined />,
  },
  {
    key: '/system',
    label: '系统管理',
    icon: <SettingOutlined />,
    children: [
      {
        key: '/system/users',
        label: '用户管理',
        icon: <TeamOutlined />,
      },
      {
        key: '/system/roles',
        label: '角色管理',
        icon: <SafetyCertificateOutlined />,
      },
      {
        key: '/system/menus',
        label: '菜单管理',
        icon: <MenuOutlined />,
      },
      {
        key: '/system/settings',
        label: '系统设置',
        icon: <SettingOutlined />,
      },
    ],
  },
]

/**
 * 按权限点过滤菜单树
 * - 叶子菜单：key 在授权集合中才可见
 * - 父级分组：过滤后无可见子项时整组隐藏
 */
export function filterMenusByPermissions(menus: AppMenu[], grantedKeys: Set<string>): AppMenu[] {
  return menus.reduce<AppMenu[]>((acc, menu) => {
    if (menu.children) {
      const children = filterMenusByPermissions(menu.children, grantedKeys)
      // 父菜单无可见子项时隐藏整个分组
      if (children.length === 0) return acc
      acc.push({ ...menu, children })
      return acc
    }
    if (grantedKeys.has(menu.key)) acc.push(menu)
    return acc
  }, [])
}

/**
 * 路径是否命中菜单：精确相等，或菜单是路径的上级前缀（边界为 /）
 * 例：/system/users 命中 /system；/system/users/123 命中 /system/users
 * 根菜单 '/' 只做精确匹配，避免吞掉所有路径
 */
function isMenuMatch(key: string, pathname: string): boolean {
  if (key === pathname) return true
  if (key === '/') return false
  return pathname.startsWith(`${key}/`)
}

/**
 * 根据当前路径查找菜单链路（用于面包屑 / 选中态 / 页签标题）
 * - 精确匹配 + 最长前缀匹配，动态详情路由（如 /system/users/:id）也能命中上级菜单
 * - 返回从根到“最深匹配菜单项”的路径链；未命中返回空数组
 */
export function findMenuPath(menus: AppMenu[], pathname: string): AppMenu[] {
  let best: AppMenu[] = []
  for (const menu of menus) {
    if (!isMenuMatch(menu.key, pathname)) continue
    const sub = menu.children ? findMenuPath(menu.children, pathname) : []
    const chain = sub.length > 0 ? [menu, ...sub] : [menu]
    // 多条命中时取叶子 key 最长（最具体）的链路
    if (
      best.length === 0 ||
      chain.at(-1)!.key.length > best.at(-1)!.key.length
    ) {
      best = chain
    }
  }
  return best
}

/**
 * 收集全部叶子菜单（无 children）的 key
 * 侧边菜单仅叶子节点点击触发导航，父级分组只做展开/收起
 */
export function collectLeafKeys(menus: AppMenu[]): Set<string> {
  const keys = new Set<string>()
  const walk = (list: AppMenu[]) => {
    list.forEach((menu) => {
      if (menu.children) {
        walk(menu.children)
      } else {
        keys.add(menu.key)
      }
    })
  }
  walk(menus)
  return keys
}
