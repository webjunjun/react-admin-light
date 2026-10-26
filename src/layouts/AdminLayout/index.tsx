import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { App, Avatar, Breadcrumb, Button, Dropdown, Layout, Menu, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { KeepAlive, useKeepAliveRef } from 'keepalive-for-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useOutlet } from 'react-router-dom'

import { MAX_ALIVE_TIME, MAX_TABS } from '@/constants/keepalive'
import {
  appMenus,
  collectLeafKeys,
  filterMenusByPermissions,
  findMenuPath,
} from '@/router/menu'
import type { AppMenu } from '@/router/menu'
import { useTabsStore } from '@/stores/tabs'
import { useUserStore } from '@/stores/user'

import TabsBar from './TabsBar'
import styles from './index.module.css'

const { Sider, Header, Content } = Layout

/** 侧边栏折叠状态持久化 key */
const SIDER_STORAGE_KEY = 'app-sider-collapsed'

/** 系统结果页路径：仅展示提示，不登记页签/缓存 */
const SYSTEM_PATHS = new Set(['/403', '/404'])

/** 菜单配置 → antd Menu items */
function toMenuItems(menus: AppMenu[]): NonNullable<MenuProps['items']> {
  return menus.map((menu) => ({
    key: menu.key,
    icon: menu.icon,
    label: menu.label,
    children: menu.children ? toMenuItems(menu.children) : undefined,
  }))
}

/**
 * 企业级后台布局（经典布局：侧边菜单 + 顶部导航 + 面包屑 + 多标签页）
 * - 侧边菜单：按登录态权限点（角色 menuIds）过滤后动态渲染，仅叶子菜单点击跳转，父级分组展开/收起
 * - 面包屑：根据当前路径最长前缀匹配菜单链路，叶子项可点击回退
 * - 多标签页：路由变化自动登记页签（LRU 上限）；KeepAlive 按页签缓存页面，
 *   页签关闭/淘汰时统一同步销毁缓存，二者始终一一对应
 * - 内容区：<Outlet /> 渲染嵌套子路由（经 KeepAlive 缓存）
 * - 响应式：窄屏（<lg）侧边栏自动收起；折叠状态持久化
 * 仅布局框架与权限基础能力，不含业务页面
 */
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDER_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [openKeys, setOpenKeys] = useState<string[]>([])
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const outlet = useOutlet()
  const aliveRef = useKeepAliveRef()
  const { message } = App.useApp()

  const role = useUserStore((s) => s.role)
  const permissions = useUserStore((s) => s.permissions)
  const userInfo = useUserStore((s) => s.userInfo)
  const token = useUserStore((s) => s.token)
  const tabs = useTabsStore((s) => s.tabs)

  // 页签 key = pathname + search（详情页多参数独立页签 / 独立缓存）
  const tabKey = pathname + search

  // 按登录态权限点过滤后的可见菜单（角色不同，授权菜单不同）
  const grantedKeys = useMemo(() => new Set(permissions), [permissions])
  const visibleMenus = useMemo(
    () => filterMenusByPermissions(appMenus, grantedKeys),
    [grantedKeys],
  )
  const menuItems = useMemo(() => toMenuItems(visibleMenus), [visibleMenus])

  // 叶子菜单 key：只有叶子点击才导航，避免父级分组（无对应页面）跳出 404
  const leafKeys = useMemo(() => collectLeafKeys(visibleMenus), [visibleMenus])

  // 面包屑：首页 + 当前路径最长前缀匹配到的菜单链路
  const menuChain = useMemo(
    () => findMenuPath(visibleMenus, pathname),
    [visibleMenus, pathname],
  )

  // 菜单选中项：取最深匹配菜单（详情路由也能高亮其所属菜单）
  const selectedKey = menuChain.at(-1)?.key ?? pathname

  // 面包屑：叶子菜单可点击，父级分组无页面仅展示文本
  const breadcrumbItems = useMemo(() => {
    const home = { title: <Link to="/">首页</Link> }
    const chainItems = menuChain.map((menu) => ({
      title: menu.children ? (
        menu.label
      ) : (
        <Link to={menu.key}>{menu.label}</Link>
      ),
    }))
    return [home, ...chainItems]
  }, [menuChain])

  // 路由变化自动登记页签（标题取角色过滤后的菜单，避免泄露隐藏功能；
  // 工作台固定不可关闭；403/404 系统页不登记）
  useEffect(() => {
    if (SYSTEM_PATHS.has(pathname)) return
    const chain = findMenuPath(visibleMenus, pathname)
    const title = chain.at(-1)?.label ?? pathname
    useTabsStore.getState().addTab({
      key: tabKey,
      path: pathname,
      search,
      title,
      closable: pathname !== '/',
    })
  }, [pathname, search, tabKey, visibleMenus])

  // 路由变化自动展开所属父级分组（只加不减，用户手动收起保持有效）
  useEffect(() => {
    if (menuChain.length <= 1) return
    const parents = menuChain.slice(0, -1).map((menu) => menu.key)
    setOpenKeys((prev) => {
      const merged = Array.from(new Set([...prev, ...parents]))
      return merged.length === prev.length ? prev : merged
    })
  }, [menuChain])

  // 页签关闭/淘汰（含登出清空）时统一销毁对应缓存；
  // 以本次与上次 key 列表之差为准，覆盖所有移除路径
  const prevTabKeysRef = useRef<string[]>([])
  useEffect(() => {
    const currentKeys = tabs.map((tab) => tab.key)
    const removed = prevTabKeysRef.current.filter(
      (key) => !currentKeys.includes(key),
    )
    if (removed.length > 0) {
      void aliveRef.current?.destroy(removed)
    }
    prevTabKeysRef.current = currentKeys
    // aliveRef 为稳定引用，列入依赖仅为满足 exhaustive-deps
  }, [tabs, aliveRef])

  // 登出（token 清空）时销毁全部缓存页签，配合页签同步双保险防内存泄漏
  useEffect(() => {
    if (!token) {
      void aliveRef.current?.destroyAll()
    }
  }, [token, aliveRef])

  // 内置角色显示中文名，自定义角色显示角色名称兜底为编码（role 仅存编码）
  const roleText = role === 'admin' ? '管理员' : role === 'user' ? '普通用户' : role
  const roleTagColor = role === 'admin' ? 'gold' : 'blue'

  /** 切换折叠并持久化 */
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDER_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* 持久化失败不影响使用 */
      }
      return next
    })
  }

  /** 退出登录：清空用户态（联动清空全部页签 + 销毁缓存，见 clearUserInfo）后回登录页 */
  const handleLogout = () => {
    useUserStore.getState().clearUserInfo()
    void message.success('已退出登录')
    navigate('/login', { replace: true })
  }

  /** 顶栏用户区下拉（头像 + 用户名 → 退出登录） */
  const userMenuItems: NonNullable<MenuProps['items']> = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className={styles.root}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={64}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          // 窄屏自动收起；恢复宽屏时不自动展开，避免覆盖用户选择
          if (broken) setCollapsed(true)
        }}
      >
        <div className={styles.logo}>{collapsed ? 'R' : import.meta.env.VITE_APP_TITLE}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={({ key }) => {
            if (leafKeys.has(key)) navigate(key)
          }}
        />
      </Sider>
      <Layout className={styles.main}>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              aria-label={collapsed ? '展开菜单' : '收起菜单'}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
            />
          </div>
          <div className={styles.userArea}>
            <Tag color={roleTagColor}>{roleText}</Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <span className={styles.userTrigger}>
                <Avatar size="small" src={userInfo?.avatar} icon={<UserOutlined />} />
                <span>{userInfo?.nickname ?? userInfo?.username ?? '未登录'}</span>
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content className={styles.content}>
          {/* 多标签页栏：打开/关闭/刷新页签，关闭由布局同步销毁缓存 */}
          <TabsBar aliveRef={aliveRef} />
          {/* 面包屑 */}
          <Breadcrumb className={styles.breadcrumb} items={breadcrumbItems} />
          {/* 路由多标签页缓存：按页签 key 缓存页面实例，LRU 淘汰防内存泄漏 */}
          <KeepAlive
            aliveRef={aliveRef}
            activeCacheKey={tabKey}
            max={MAX_TABS}
            maxAliveTime={MAX_ALIVE_TIME}
            containerClassName={styles.aliveContainer}
          >
            <div className={styles.page}>
              {/* 布局嵌套路由出口：子路由页面渲染于此（经 KeepAlive 缓存） */}
              {outlet}
            </div>
          </KeepAlive>
        </Content>
      </Layout>
    </Layout>
  )
}
