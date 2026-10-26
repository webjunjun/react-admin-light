import { useState } from 'react'
import type { FormEvent } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@/api/modules/auth'
import { useUserStore } from '@/stores/user'
import type { LoginParams } from '@/types/user'

import styles from './index.module.css'

/** 登录页测试账号提示（与 mock 账号体系一致：admin 系统管理员 / user02 普通用户） */
const DEMO_ACCOUNTS = [
  { username: 'admin', password: '123456', role: '管理员' },
  { username: 'user02', password: '123456', role: '普通用户' },
]

/**
 * 登录页（纯静态 UI + 登录逻辑）
 * - 表单校验：用户名 / 密码必填（提交时前端校验 + 后端业务校验双保险）
 * - 请求：authApi.login（axios 封装 + MSW mock，错误提示由 request 层全局 message 注入）
 * - 登录成功：token / userInfo / role 一次写入 userStore（localStorage 持久化，刷新不丢）
 * - 跳转：登录后重定向首页 /（GuestOnly 守卫兜底，重复导航无害）
 * - loading：提交中禁用表单与按钮，防重复提交
 */
export default function Login() {
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 前端基础校验（后端仍会兜底校验，业务错误经全局提示）
    if (!username.trim()) {
      void message.warning('请输入用户名')
      return
    }
    if (!password) {
      void message.warning('请输入密码')
      return
    }

    const params: LoginParams = { username: username.trim(), password }
    setSubmitting(true)
    try {
      const res = await authApi.login(params)
      // 原子写入登录态：token + 用户信息 + 角色 + 权限点（菜单可见性 / 路由守卫随之联动）
      useUserStore.setState({
        token: res.token,
        userInfo: res.userInfo,
        role: res.role,
        permissions: res.permissions,
      })
      void message.success(`欢迎回来，${res.userInfo.nickname ?? res.userInfo.username}`)
      navigate('/', { replace: true })
    } catch {
      // 失败原因（账号密码错误等）已由 request 层全局提示，这里保持表单输入
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>欢迎登录</h1>
        <p className={styles.subtitle}>React Admin Light 后台管理</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              className={styles.input}
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={submitting}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              密码
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>

          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? '登 录 中...' : '登 录'}
          </button>
        </form>

        <div className={styles.tips}>
          <p className={styles.tipsTitle}>演示账号（Mock 环境）</p>
          {DEMO_ACCOUNTS.map((item) => (
            <p key={item.username} className={styles.tipsItem}>
              {item.role}：{item.username} / {item.password}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
