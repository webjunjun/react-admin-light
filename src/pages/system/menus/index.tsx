import { useEffect, useMemo, useState } from 'react'
import { Card, Spin, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { permissionApi } from '@/api/modules/role'
import type { PermissionNode } from '@/types/role'

/**
 * 菜单管理页（只读展示）
 * - 展示当前系统的菜单 + 按钮权限点结构（树形表格）
 * - 权限点是系统能力清单，与代码中的路由 / 页面按钮一一对应，不支持在线增删改
 * - 数据来源：GET /permissions/menus（mock 静态数据，与 menu.tsx 路由表镜像）
 */
export default function SystemMenus() {
  const [treeData, setTreeData] = useState<PermissionNode[]>([])
  const [loading, setLoading] = useState(false)

  const loadTree = async () => {
    setLoading(true)
    try {
      const tree = await permissionApi.getMenuTree()
      setTreeData(tree)
    } catch {
      // 错误提示由 request 层全局处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTree()
  }, [])

  // 类型标签：菜单 = 绿色，按钮 = 蓝色
  const typeTag = (type: PermissionNode['type']) =>
    type === 'menu' ? <Tag color="green">菜单</Tag> : <Tag color="blue">按钮</Tag>

  const columns = useMemo<TableColumnsType<PermissionNode>>(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        width: 200,
      },
      {
        title: '权限标识',
        dataIndex: 'id',
        width: 260,
        render: (id: string) => <code style={{ color: '#555' }}>{id}</code>,
      },
      {
        title: '类型',
        dataIndex: 'type',
        width: 90,
        render: (type: PermissionNode['type']) => typeTag(type),
      },
      {
        title: '说明',
        render: (_, record) => {
          if (record.type === 'button') {
            return <span style={{ color: '#999' }}>操作级权限点，控制页面内按钮显隐</span>
          }
          if (record.children?.length) {
            return <span style={{ color: '#999' }}>菜单分组，含 {record.children.length} 个子项</span>
          }
          return <span style={{ color: '#999' }}>页面访问权限，控制菜单可见性与路由守卫</span>
        },
      },
    ],
    [],
  )

  return (
    <Card>
      <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
        以下为系统当前的菜单与按钮权限点清单（只读，由系统能力决定，不可在线修改）。
      </div>
      <Spin spinning={loading}>
        <Table<PermissionNode>
          rowKey="id"
          columns={columns}
          dataSource={treeData}
          // 树形表格：用 children 字段渲染层级
          childrenColumnName="children"
          defaultExpandAllRows
          pagination={false}
          size="middle"
        />
      </Spin>
    </Card>
  )
}
