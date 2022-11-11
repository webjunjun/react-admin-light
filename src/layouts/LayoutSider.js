import {
  PieChartOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
const { Sider } = Layout

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label
  }
}

const items = [
  getItem('home', '/home', <PieChartOutlined />),
  getItem('list', '/list', <UserOutlined />)
]

const LayoutSider = () => {
  // 定义是否展开/收起的变量
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
      <div className="logo" />
      <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
    </Sider>
  )
}
export default LayoutSider
