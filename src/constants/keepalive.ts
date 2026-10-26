/**
 * 多标签页缓存系统常量
 * - MAX_TABS：页签与 KeepAlive 缓存的共同上限，页签列表与缓存实例始终一一对应。
 *   淘汰对象由 tabs store 按最近激活顺序（recentKeys）选出，KeepAlive 内置 max 作为
 *   同源兜底（两者指向同一个"最久未激活"页签），防止内存泄漏
 * - MAX_ALIVE_TIME：缓存节点最大存活时间（秒）。默认 0 = 不限制：
 *   缓存生命周期只由页签关闭/ LRU 决定，避免出现“页签还在但状态被静默重建”
 *   的语义不一致；如确需长驻超时回收，可改为正数（如 1800）
 */
export const MAX_TABS = 10
export const MAX_ALIVE_TIME = 0
