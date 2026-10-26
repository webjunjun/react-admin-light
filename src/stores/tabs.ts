import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { MAX_TABS } from '@/constants/keepalive'

/**
 * 多标签页元数据（仅存页签列表，不存页面缓存）
 * - 持久化：sessionStorage，刷新页面后页签不丢失（页面缓存为内存态，刷新后重建）
 * - key = pathname + search：同一路由不同查询参数视为独立页签（详情页多参数独立缓存）。
 *   取舍：列表页若把筛选/分页参数写进 URL，每次筛选都会新增页签，由 MAX_TABS 上限兜底；
 *   如后续确需收敛，可改为仅对详情类路由计入 search
 * - 排列顺序 = 打开顺序：激活已有页签不重排，页签位置稳定（不做"提到队尾"）
 * - 淘汰顺序 = 最近激活顺序（recentKeys）：两者分开后，展示顺序与 LRU 互不干扰；
 *   淘汰优先选未激活过的页签，其次选最久未激活的可关闭页签，与 KeepAlive 内置 LRU 同源，
 *   避免"页签与缓存淘汰的不是同一个"导致状态静默丢失
 */
export interface TabItem {
  /** 页签唯一 key（pathname + search） */
  key: string
  /** 路由路径（不含 search） */
  path: string
  /** 查询串（含 ?，可能为空串） */
  search: string
  /** 页签标题（来自菜单配置） */
  title: string
  /** 是否可关闭（固定页签如工作台不可关闭） */
  closable: boolean
}

interface TabsState {
  tabs: TabItem[]
  /** 最近激活顺序（key 由旧到新），仅用于 LRU 淘汰计算，不持久化 */
  recentKeys: string[]
  /** 路由变化时登记页签：已存在则保持不变；不存在则追加；超 MAX_TABS 按 LRU 淘汰 */
  addTab: (tab: Omit<TabItem, 'key'> & { key: string }) => void
  /** 关闭单个页签 */
  removeTab: (key: string) => void
  /** 关闭其他页签（保留固定页签） */
  removeOther: (key: string) => void
  /** 关闭指定页签左侧的所有可关闭页签（保留固定页签） */
  removeLeft: (key: string) => void
  /** 关闭指定页签右侧的所有可关闭页签（保留固定页签） */
  removeRight: (key: string) => void
  /** 清空全部页签（登出时调用） */
  clearTabs: () => void
}

/** 过滤激活顺序，仅保留仍存在的页签 key（防止随会话无限增长） */
function pruneRecent(recentKeys: string[], tabs: TabItem[]) {
  const keys = new Set(tabs.map((tab) => tab.key))
  return recentKeys.filter((key) => keys.has(key))
}

/**
 * 选择淘汰对象
 * - 优先未激活过的页签（按打开顺序，即最早打开的最先淘汰；刷新后激活顺序为空时走此分支）
 * - 否则取最久未激活的可关闭页签
 * - 全是固定页签则返回 null，不再淘汰
 */
function pickEvictKey(tabs: TabItem[], recentKeys: string[]) {
  const untouched = tabs.find(
    (tab) => tab.closable && !recentKeys.includes(tab.key),
  )
  if (untouched) return untouched.key
  return (
    recentKeys.find((key) => tabs.find((tab) => tab.key === key)?.closable) ??
    null
  )
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set) => ({
      tabs: [],
      recentKeys: [],

      addTab: (tab) =>
        set((state) => {
          const recentKeys = [
            ...state.recentKeys.filter((key) => key !== tab.key),
            tab.key,
          ]

          // 已存在（含固定页签）：只更新激活顺序，打开顺序保持不变
          if (state.tabs.some((t) => t.key === tab.key)) {
            return { recentKeys }
          }

          let nextTabs = [...state.tabs, tab]
          while (nextTabs.length > MAX_TABS) {
            const victim = pickEvictKey(nextTabs, recentKeys)
            if (!victim) break
            nextTabs = nextTabs.filter((t) => t.key !== victim)
          }
          return { tabs: nextTabs, recentKeys: pruneRecent(recentKeys, nextTabs) }
        }),

      removeTab: (key) =>
        set((state) => {
          const tabs = state.tabs.filter((t) => t.key !== key)
          return { tabs, recentKeys: pruneRecent(state.recentKeys, tabs) }
        }),

      removeOther: (key) =>
        set((state) => {
          const tabs = state.tabs.filter((t) => t.key === key || !t.closable)
          return { tabs, recentKeys: pruneRecent(state.recentKeys, tabs) }
        }),

      removeLeft: (key) =>
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.key === key)
          if (idx < 0) return state
          const tabs = state.tabs.filter((t, i) => i >= idx || !t.closable)
          return { tabs, recentKeys: pruneRecent(state.recentKeys, tabs) }
        }),

      removeRight: (key) =>
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.key === key)
          if (idx < 0) return state
          const tabs = state.tabs.filter((t, i) => i <= idx || !t.closable)
          return { tabs, recentKeys: pruneRecent(state.recentKeys, tabs) }
        }),

      clearTabs: () => set({ tabs: [], recentKeys: [] }),
    }),
    {
      name: 'app-tabs',
      storage: createJSONStorage(() => sessionStorage),
      // 仅持久化页签列表；激活顺序属会话内内存态（刷新后缓存本就重建，无恢复意义，也不该覆盖）
      partialize: (state) => ({ tabs: state.tabs }),
    },
  ),
)
