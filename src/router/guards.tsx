import { Navigate, Outlet } from 'react-router-dom'

import { useUserStore } from '@/stores/user'

/**
 * 路由守卫组件（纯鉴权逻辑，不渲染任何 UI）
 *
 * - RequireAuth：包裹需登录页面。未登录 → 重定向 /login
 * - RequirePermission：包裹权限受限页面。登录态 permissions 不含指定权限点
 *   （权限点 id 即路由 path）→ 重定向 /403；不能仅靠隐藏菜单控权
 * - GuestOnly：包裹仅游客页面（如 /login）。已登录 → 重定向首页 /
 *
 * 登录态由 useUserStore.token 判定，持久化在 localStorage，
 * 页面刷新后同步恢复，守卫判定不丢失。
 */

/** 需登录：未登录跳转 /login */
export function RequireAuth() {
  const token = useUserStore((s) => s.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

/** 权限受限：当前登录态不具备指定权限点（路由 path）时跳转 403 页 */
export function RequirePermission({ permission }: { permission: string }) {
  const permissions = useUserStore((s) => s.permissions)

  if (!permissions.includes(permission)) {
    return <Navigate to="/403" replace />
  }
  return <Outlet />
}

/** 仅游客：已登录跳转首页 */
export function GuestOnly() {
  const token = useUserStore((s) => s.token)

  if (token) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
