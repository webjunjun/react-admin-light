import {
  CloseOutlined,
  ColumnWidthOutlined,
  ReloadOutlined,
  VerticalLeftOutlined,
  VerticalRightOutlined,
} from '@ant-design/icons'
import { Dropdown, Tabs } from 'antd'
import type { MenuProps, TabsProps } from 'antd'
import type { KeepAliveRef } from 'keepalive-for-react'
import { useMemo } from 'react'
import type { RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useTabsStore } from '@/stores/tabs'

import styles from './TabsBar.module.css'

interface TabsBarProps {
  /** KeepAlive 缓存操作实例（关闭页签时同步销毁对应缓存，防内存泄漏） */
  aliveRef: RefObject<KeepAliveRef | null>
}

/** 页签右键菜单动作 */
type TabAction = 'refresh' | 'close' | 'closeOthers' | 'closeLeft' | 'closeRight'

/**
 *多标签页栏（只负责页签数据与导航）
 * - 页签 key = pathname + search（详情页多参数独立页签）
 * - 页签按打开顺序排列：激活已有页签不重排，位置稳定
 * - 点击切换导航；× 或右键"关闭当前"等仅操作 tabs store
 * - 关闭其他/左/右 若把当前页签一并移除，自动回退导航到锚点页签，避免 activeKey 悬空
 * - 缓存销毁由 AdminLayout 监听 tabs 变化统一同步，避免两处各管一份
 * - 刷新页签：销毁重建当前缓存实例
 */
export default function TabsBar({ aliveRef }: TabsBarProps) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const currentKey = pathname + search
  const tabs = useTabsStore((s) => s.tabs)

  /** 关闭单个页签；若关闭的是当前页签，自动导航到相邻页签 */
  const closeTab = (key: string) => {
    const snapshot = useTabsStore.getState().tabs
    const idx = snapshot.findIndex((t) => t.key === key)
    useTabsStore.getState().removeTab(key)

    if (key === currentKey) {
      const next = snapshot[idx + 1] ?? snapshot[idx - 1] ?? null
      navigate(next ? next.path + next.search : '/')
    }
  }

  /**
   * 关闭动作执行后兜底：当前页签若已被移除则回退导航
   * 锚点页签（右键那一项）在四种关闭操作中一定会保留，因此优先回到锚点
   */
  const ensureActiveTab = (anchorKey: string) => {
    const next = useTabsStore.getState().tabs
    if (next.some((t) => t.key === currentKey)) return
    const anchor = next.find((t) => t.key === anchorKey)
    navigate(anchor ? anchor.path + anchor.search : '/')
  }

  /** 目标页签在列表中的下标（不存在则不执行关闭左/右） */
  const idxOf = (key: string) => tabs.findIndex((t) => t.key === key)

  /** 关闭其他：保留目标页签与固定页签（缓存销毁由布局统一同步） */
  const closeOthers = (key: string) => {
    useTabsStore.getState().removeOther(key)
    ensureActiveTab(key)
  }

  /** 关闭左侧：保留固定页签 */
  const closeLeft = (key: string) => {
    if (idxOf(key) < 0) return
    useTabsStore.getState().removeLeft(key)
    ensureActiveTab(key)
  }

  /** 关闭右侧：保留固定页签 */
  const closeRight = (key: string) => {
    if (idxOf(key) < 0) return
    useTabsStore.getState().removeRight(key)
    ensureActiveTab(key)
  }

  const handleMenuClick = (action: TabAction, tabKey: string, closable: boolean) => {
    switch (action) {
      case 'refresh':
        aliveRef.current?.refresh(tabKey)
        break
      case 'close':
        if (closable) closeTab(tabKey)
        break
      case 'closeOthers':
        closeOthers(tabKey)
        break
      case 'closeLeft':
        closeLeft(tabKey)
        break
      case 'closeRight':
        closeRight(tabKey)
        break
    }
  }

  const buildContextMenu = (tabKey: string, closable: boolean): MenuProps => ({
    items: [
      { key: 'refresh', icon: <ReloadOutlined />, label: '刷新页签' },
      { type: 'divider' },
      { key: 'close', icon: <CloseOutlined />, label: '关闭当前', disabled: !closable },
      { key: 'closeOthers', icon: <ColumnWidthOutlined />, label: '关闭其他' },
      { key: 'closeLeft', icon: <VerticalRightOutlined />, label: '关闭左侧' },
      { key: 'closeRight', icon: <VerticalLeftOutlined />, label: '关闭右侧' },
    ],
    onClick: ({ key: action }) =>
      handleMenuClick(action as TabAction, tabKey, closable),
  })

  /**
   * 同名页签（如多个详情页共用一个菜单标题）追加后缀区分，无重名则不追加：
   * 优先取查询串（?id=1 → id=1），无查询串则取路径末段
   */
  const tabLabels = useMemo(() => {
    const counts = new Map<string, number>()
    tabs.forEach((tab) => counts.set(tab.title, (counts.get(tab.title) ?? 0) + 1))

    const labels = new Map<string, string>()
    tabs.forEach((tab) => {
      if ((counts.get(tab.title) ?? 0) < 2) {
        labels.set(tab.key, tab.title)
        return
      }
      const segments = tab.path.split('/').filter(Boolean)
      const suffix =
        tab.search.replace(/^\?/, '') || segments[segments.length - 1] || ''
      labels.set(tab.key, suffix ? `${tab.title} (${suffix})` : tab.title)
    })
    return labels
  }, [tabs])

  const tabItems: NonNullable<TabsProps['items']> = tabs.map((tab) => ({
    key: tab.key,
    closable: tab.closable,
    label: (
      <Dropdown trigger={['contextMenu']} menu={buildContextMenu(tab.key, tab.closable)}>
        <span className={styles.tabLabel} title={tab.path + tab.search}>
          {tabLabels.get(tab.key) ?? tab.title}
        </span>
      </Dropdown>
    ),
  }))

  return (
    <div className={styles.tabsBar}>
      <Tabs
        type="editable-card"
        hideAdd
        size="small"
        activeKey={currentKey}
        items={tabItems}
        onChange={(key) => navigate(key)}
        onEdit={(key, action) => {
          if (action === 'remove' && typeof key === 'string') closeTab(key)
        }}
      />
    </div>
  )
}
