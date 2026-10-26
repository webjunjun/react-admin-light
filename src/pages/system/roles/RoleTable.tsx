import { useMemo } from 'react'
import type { Key } from 'react'
import { Button, Popconfirm, Space, Switch, Table, Tag, Tooltip } from 'antd'
import type { TableColumnsType, TablePaginationConfig } from 'antd'

import type { RoleRecord, RoleStatus } from '@/types/role'

/** 角色列表表格 */
interface RoleTableProps {
  data: RoleRecord[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  /** 已选中行 key（批量删除） */
  selectedRowKeys: Key[]
  /** 正在切换状态的行 id（行级 Switch loading） */
  switchingId: string | null
  /** 权限点 id → 名称映射（权限列 Tooltip 展示） */
  permissionNameMap: Map<string, string>
  onPageChange: (page: number, pageSize: number) => void
  onSelectionChange: (keys: Key[]) => void
  onEdit: (record: RoleRecord) => void
  onDelete: (record: RoleRecord) => void
  onToggleStatus: (record: RoleRecord, status: RoleStatus) => void
}

/** 创建时间展示：YYYY-MM-DD HH:mm */
function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function RoleTable({
  data,
  loading,
  total,
  page,
  pageSize,
  selectedRowKeys,
  switchingId,
  permissionNameMap,
  onPageChange,
  onSelectionChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: RoleTableProps) {
  const columns = useMemo<TableColumnsType<RoleRecord>>(
    () => [
      {
        title: '角色名称',
        dataIndex: 'name',
        width: 150,
        render: (name: string, record) => (
          <Space size={6}>
            <span>{name}</span>
            {record.builtin && <Tag color="gold">内置</Tag>}
          </Space>
        ),
      },
      {
        title: '角色编码',
        dataIndex: 'code',
        width: 120,
        render: (code: string) => <Tag>{code}</Tag>,
      },
      {
        title: '菜单权限',
        dataIndex: 'menuIds',
        width: 130,
        render: (menuIds: string[]) => {
          if (menuIds.length === 0) return <span style={{ color: '#999' }}>未授权</span>
          const names = menuIds.map((id) => permissionNameMap.get(id) ?? id)
          return (
            <Tooltip title={names.join('、')} placement="topLeft">
              <span>已授权 {menuIds.length} 项</span>
            </Tooltip>
          )
        },
      },
      {
        title: '排序',
        dataIndex: 'sort',
        width: 70,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (status: RoleStatus, record) => (
          <Tooltip title={record.builtin ? '内置角色不可停用' : undefined}>
            <Switch
              checked={status === 'enabled'}
              checkedChildren="启用"
              unCheckedChildren="停用"
              disabled={record.builtin}
              loading={switchingId === record.id}
              onChange={(checked) => onToggleStatus(record, checked ? 'enabled' : 'disabled')}
            />
          </Tooltip>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 150,
        render: (value: string) => formatTime(value),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        ellipsis: true,
        render: (remark?: string) => remark ?? <span style={{ color: '#999' }}>-</span>,
      },
      {
        title: '操作',
        key: 'action',
        width: 130,
        fixed: 'right',
        render: (_, record) => (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => onEdit(record)}>
              编辑
            </Button>
            {record.builtin ? (
              <Tooltip title="内置角色不可删除">
                <Button type="link" size="small" danger disabled>
                  删除
                </Button>
              </Tooltip>
            ) : (
              <Popconfirm
                title="确认删除该角色？"
                description={`将删除角色「${record.name}」，该操作不可恢复`}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(record)}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [switchingId, permissionNameMap, onEdit, onDelete, onToggleStatus],
  )

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50],
    showTotal: (t) => `共 ${t} 条`,
    onChange: (nextPage, nextPageSize) => onPageChange(nextPage, nextPageSize),
  }

  return (
    <Table<RoleRecord>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectionChange,
        // 内置角色不可勾选删除
        getCheckboxProps: (record) => ({ disabled: record.builtin }),
      }}
      scroll={{ x: 1100 }}
      size="middle"
    />
  )
}
