import { useEffect, useRef } from 'react'
import type { DependencyList } from 'react'
import { useEffectOnActive, useKeepAliveContext } from 'keepalive-for-react'

/**
 * keepalive-for-react 生命周期 Hooks 封装
 * - v5 起原生 hooks 更名为 useEffectOnActive / useEffectOnCreate；
 *   此处提供语义化兼容层：useActivated（页面激活）/ useUnactivated（页面失活）
 * - 仅在被 KeepAlive 缓存的页面组件内使用；未被缓存时 useActivated 退化为普通 useEffect
 */

/**
 * 页面激活回调：从缓存恢复显示时触发（首次挂载也会触发）
 * @param cb 回调，可返回清理函数
 * @param deps 依赖数组
 * @param skipMount 为 true 时跳过首次挂载，仅在"从缓存切回激活"时触发（用于激活时刷新数据）
 */
export function useActivated(
  cb: () => void | (() => void),
  deps: DependencyList = [],
  skipMount = false,
) {
  useEffectOnActive(cb, deps, skipMount)
}

/**
 * 页面失活回调：页面被切走、进入缓存（或组件被销毁）时触发
 * v5 无内置失活 hook，基于 useKeepAliveContext().active 状态迁移实现
 */
export function useUnactivated(cb: () => void, deps: DependencyList = []) {
  const { active } = useKeepAliveContext()
  const cbRef = useRef(cb)
  // ref 不允许在渲染期写入；每次提交后同步最新回调
  useEffect(() => {
    cbRef.current = cb
  })
  const prevActive = useRef(active)

  useEffect(() => {
    // active: true -> false 视为失活（切走进入缓存 / 缓存被销毁）
    if (prevActive.current && !active) {
      cbRef.current()
    }
    prevActive.current = active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps])
}
