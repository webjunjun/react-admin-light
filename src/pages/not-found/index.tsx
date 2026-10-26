import { Link } from 'react-router-dom'

import styles from './index.module.css'

/**
 * 404 页面（纯静态 UI）
 * 同时用于 /404 显式路由与通配（*）兜底
 */
export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.code}>404</div>
      <p className={styles.text}>页面不存在或已被移除</p>
      <Link className={styles.link} to="/">
        返回首页
      </Link>
    </div>
  )
}
