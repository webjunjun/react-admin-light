import type { PermissionNode } from '@/types/role'

/**
 * 权限树 mock 数据（角色授权弹窗的数据源）
 * - 与 src/router/menu.tsx 的菜单注册表、路由表保持镜像：新增页面时三处同步
 * - 菜单节点 id = 路由 path；按钮节点 id = 'path:action'
 * - 本期为静态数据；二期「菜单管理」模块上线后改由后端下发
 */
export const permissionTree: PermissionNode[] = [
  { id: '/', name: '工作台', type: 'menu' },
  {
    id: '/system',
    name: '系统管理',
    type: 'menu',
    children: [
      {
        id: '/system/users',
        name: '用户管理',
        type: 'menu',
        children: [
          { id: '/system/users:create', name: '新增用户', type: 'button' },
          { id: '/system/users:update', name: '编辑用户', type: 'button' },
          { id: '/system/users:delete', name: '删除用户', type: 'button' },
          { id: '/system/users:status', name: '启停用户', type: 'button' },
        ],
      },
      {
        id: '/system/roles',
        name: '角色管理',
        type: 'menu',
        children: [
          { id: '/system/roles:create', name: '新增角色', type: 'button' },
          { id: '/system/roles:update', name: '编辑角色', type: 'button' },
          { id: '/system/roles:delete', name: '删除角色', type: 'button' },
          { id: '/system/roles:status', name: '启停角色', type: 'button' },
        ],
      },
      { id: '/system/menus', name: '菜单管理', type: 'menu' },
      { id: '/system/settings', name: '系统设置', type: 'menu' },
    ],
  },
]

/** 拍平权限树，返回全部节点 id（含菜单与按钮） */
export function flattenPermissionIds(nodes: PermissionNode[]): string[] {
  const ids: string[] = []
  const walk = (list: PermissionNode[]) => {
    list.forEach((node) => {
      ids.push(node.id)
      if (node.children) walk(node.children)
    })
  }
  walk(nodes)
  return ids
}

/** 拍平权限树，返回 id → name 映射（表格权限列展示用） */
export function flattenPermissionNameMap(nodes: PermissionNode[]): Map<string, string> {
  const map = new Map<string, string>()
  const walk = (list: PermissionNode[]) => {
    list.forEach((node) => {
      map.set(node.id, node.name)
      if (node.children) walk(node.children)
    })
  }
  walk(nodes)
  return map
}
