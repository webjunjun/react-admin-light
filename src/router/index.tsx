import { createBrowserRouter, Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import AdminLayout from '@/layouts/AdminLayout'

import { GuestOnly, RequireAuth, RequirePermission } from './guards'

/**
 * 基础路由表（路由 + 鉴权守卫 + 后台布局，无业务逻辑）
 * - 需登录页面：放入 RequireAuth → AdminLayout 的 children（渲染在布局 Outlet 内）
 * - 权限受限页面：再嵌套 RequirePermission（无权跳转 /403，禁止仅靠隐藏菜单控权）
 * - 游客页面：放入 GuestOnly 的 children 中
 * - lazy：路由级代码分割，命中该路由时才加载对应 chunk
 * - 侧边菜单：与 src/router/menu.tsx 配置一一对应（key = path）
 */

// 404 页面懒加载（/404 显式路由与 * 通配兜底共用）
const notFoundLazy = async () => {
  const { default: Component } = await import('@/pages/not-found')
  return { Component }
}

// 403 页面懒加载
const forbiddenLazy = async () => {
  const { default: Component } = await import('@/pages/forbidden')
  return { Component }
}

export const routes: RouteObject[] = [
  {
    path: '/',
    // 路由出口：所有子路由组件渲染在此
    element: <Outlet />,
    children: [
      {
        // 需登录：未登录统一拦截跳转 /login
        element: <RequireAuth />,
        children: [
          {
            // 企业级后台布局：侧边菜单 + 顶栏 + 面包屑 + 内容区 Outlet
            element: <AdminLayout />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { default: Component } = await import('@/pages/home')
                  return { Component }
                },
              },
              {
                path: 'dashboard',
                lazy: async () => {
                  const { default: Component } = await import('@/pages/home')
                  return { Component }
                },
              },
              {
                // 需具备「用户管理」菜单权限点：无权限直接访问 URL 也会被拦截到 /403
                element: <RequirePermission permission="/system/users" />,
                children: [
                  {
                    path: 'system/users',
                    lazy: async () => {
                      const { default: Component } = await import('@/pages/system/users')
                      return { Component }
                    },
                  },
                ],
              },
              {
                // 需具备「角色管理」菜单权限点
                element: <RequirePermission permission="/system/roles" />,
                children: [
                  {
                    path: 'system/roles',
                    lazy: async () => {
                      const { default: Component } = await import('@/pages/system/roles')
                      return { Component }
                    },
                  },
                ],
              },
              {
                // 需具备「菜单管理」菜单权限点
                element: <RequirePermission permission="/system/menus" />,
                children: [
                  {
                    path: 'system/menus',
                    lazy: async () => {
                      const { default: Component } = await import('@/pages/system/menus')
                      return { Component }
                    },
                  },
                ],
              },
              {
                path: 'system/settings',
                lazy: async () => {
                  const { default: Component } = await import('@/pages/system/settings')
                  return { Component }
                },
              },
              // 系统结果页：在框架内渲染，不登记页签
              { path: '403', lazy: forbiddenLazy },
              { path: '404', lazy: notFoundLazy },
              // 通配兜底：已登录用户错误地址仍保留框架，未登录由 RequireAuth 拦截
              { path: '*', lazy: notFoundLazy },
            ],
          },
        ],
      },
      {
        // 仅游客：已登录访问 /login 自动跳转首页
        element: <GuestOnly />,
        children: [
          {
            path: 'login',
            lazy: async () => {
              const { default: Component } = await import('@/pages/login')
              return { Component }
            },
          },
        ],
      },
    ],
  },
]

/**
 * History 路由模式（基于 HTML5 History API，URL 无 #）
 * 注意：生产部署需将任意路径回退到 index.html
 *（如 nginx: try_files $uri $uri/ /index.html；Vite dev 已内置回退）
 */
export const router = createBrowserRouter(routes)
