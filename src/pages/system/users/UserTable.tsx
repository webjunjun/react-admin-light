import { useMemo } from 'react'
import type { Key } from 'react'
import { Button, Popconfirm, Space, Switch, Table, Tag } from 'antd'
import type { TableColumnsType, TablePaginationConfig } from 'antd'

import type { UserRecord, UserStatus } from '@/types/user'

/** 用户列表表格 */
interface UserTableProps {
  data: UserRecord[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  /** 已选中行 key（批量删除） */
  selectedRowKeys: Key[]
  /** 正在切换状态的行 id（行级 Switch loading） */
  switchingId: string | null
  onPageChange: (page: number, pageSize: number) => void
  onSelectionChange: (keys: Key[]) => void
  onEdit: (record: UserRecord) => void
  onDelete: (record: UserRecord) => void
  onToggleStatus: (record: UserRecord, status: UserStatus) => void
}

/** 角色标签：内置角色显示中文名，自定义角色直接显示编码 */
function RoleTag({ role }: { role: UserRecord['role'] }) {
  const text = role === 'admin' ? '管理员' : role === 'user' ? '普通用户' : role
  return <Tag color={role === 'admin' ? 'gold' : 'blue'}>{text}</Tag>
}

/** 创建时间展示：YYYY-MM-DD HH:mm */
function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function UserTable({
  data,
  loading,
  total,
  page,
  pageSize,
  selectedRowKeys,
  switchingId,
  onPageChange,
  onSelectionChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: UserTableProps) {
  const columns = useMemo<TableColumnsType<UserRecord>>(
    () => [
      {
        title: '用户名',
        dataIndex: 'username',
        width: 120,
        ellipsis: true,
      },
      {
        title: '昵称',
        dataIndex: 'nickname',
        width: 120,
        ellipsis: true,
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        width: 200,
        ellipsis: true,
      },
      {
        title: '手机号',
        dataIndex: 'phone',
        width: 130,
      },
      {
        title: '角色',
        dataIndex: 'role',
        width: 100,
        render: (role: UserRecord['role']) => <RoleTag role={role} />,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (status: UserStatus, record) => (
          <Switch
            checked={status === 'enabled'}
            checkedChildren="启用"
            unCheckedChildren="停用"
            loading={switchingId === record.id}
            onChange={(checked) => onToggleStatus(record, checked ? 'enabled' : 'disabled')}
          />
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 160,
        render: (value: string) => formatTime(value),
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
            <Popconfirm
              title="确认删除该用户？"
              description={`将删除用户「${record.username}」，该操作不可恢复`}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [switchingId, onEdit, onDelete, onToggleStatus],
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
    <Table<UserRecord>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      rowSelection={{ selectedRowKeys, onChange: onSelectionChange }}
      scroll={{ x: 1080 }}
      size="middle"
    />
  )
}
