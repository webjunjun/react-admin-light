import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

/**
 * 403 无权限页面（由 RequirePermission 守卫重定向进入）
 */
export default function Forbidden() {
  const navigate = useNavigate()

  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问该页面。"
      extra={
        <Button type="primary" onClick={() => navigate('/', { replace: true })}>
          返回首页
        </Button>
      }
    />
  )
}
