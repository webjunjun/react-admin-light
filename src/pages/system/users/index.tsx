import { useCallback, useEffect, useRef, useState } from 'react'
import type { Key } from 'react'
import { App, Button, Card, Form, Input, Popconfirm, Select, Space } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'

import { userApi } from '@/api/modules/user'
import { useActivated } from '@/hooks/useKeepAliveLifecycle'
import type { UserRole } from '@/stores/user'
import type {
  PageResult,
  UserCreatePayload,
  UserQuery,
  UserRecord,
  UserStatus,
  UserUpdatePayload,
} from '@/types/user'

import UserFormModal from './UserFormModal'
import UserTable from './UserTable'

/** 查询表单值 */
interface SearchFormValues {
  keyword?: string
  status?: UserStatus
  role?: UserRole
}

/** 空查询条件（重置用） */
const EMPTY_QUERY: Required<Pick<UserQuery, 'keyword' | 'status' | 'role'>> = {
  keyword: '',
  status: '',
  role: '',
}

/**
 * 用户管理页（完整业务 CRUD）
 * - 列表分页 + 关键字/状态/角色条件查询
 * - 新增 / 编辑弹窗（表单校验 + 数据回显）
 * - 单条删除 / 批量删除（Popconfirm 二次确认）
 * - 状态启停切换（Switch 行级 loading）
 * - 数据层全部走 userApi（axios 封装 + MSW mock）
 * - 多标签页适配：查询条件与列表状态被 KeepAlive 缓存；
 *   页签从缓存切回（非首次挂载）时自动刷新列表，保证数据最新
 */
export default function SystemUsers() {
  const { message } = App.useApp()
  const [searchForm] = Form.useForm<SearchFormValues>()

  // 查询条件（查询/重置时更新，驱动列表重新加载）
  const [query, setQuery] = useState<Required<Pick<UserQuery, 'keyword' | 'status' | 'role'>>>(EMPTY_QUERY)
  // 分页
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  // 列表数据
  const [data, setData] = useState<PageResult<UserRecord>>({ list: [], total: 0, page: 1, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  // 行选择（批量删除）
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  // 行级状态切换 loading
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /** 加载列表（query / page / pageSize 变化时由 useEffect 触发） */
  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userApi.getUserList({
        page,
        pageSize,
        keyword: query.keyword || undefined,
        status: query.status || undefined,
        role: query.role || undefined,
      })
      setData(res)
      // 当前页被删空且非第一页时，回退一页（setPage 触发 deps 变化再次加载）
      if (res.list.length === 0 && res.page > 1) {
        setPage(res.page - 1)
      }
    } catch {
      // 错误提示由 request 层全局处理（setNotifyError 注入 antd message）
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, query])

  // 多标签页适配：从缓存切回（跳过首次挂载）时刷新列表，保持页签恢复后数据最新
  const loadListRef = useRef(loadList)
  useEffect(() => {
    // ref 不允许在渲染期写入，随 effect 提交同步最新引用后立即拉取
    loadListRef.current = loadList
    void loadList()
  }, [loadList])

  useActivated(() => {
    void loadListRef.current()
  }, [], true)

  /** 查询 / 重置：重置到第一页 */
  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setQuery({
      keyword: values.keyword?.trim() ?? '',
      status: values.status ?? '',
      role: values.role ?? '',
    })
    setPage(1)
  }
  const handleReset = () => {
    searchForm.resetFields()
    setQuery(EMPTY_QUERY)
    setPage(1)
  }

  /** 分页变化 */
  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  /** 打开新增弹窗 */
  const handleOpenCreate = () => {
    setModalMode('create')
    setEditingRecord(null)
    setModalOpen(true)
  }

  /** 打开编辑弹窗（数据回显） */
  const handleOpenEdit = (record: UserRecord) => {
    setModalMode('edit')
    setEditingRecord(record)
    setModalOpen(true)
  }

  /** 弹窗提交（新增 / 编辑统一入口） */
  const handleSubmit = async (payload: UserCreatePayload | UserUpdatePayload) => {
    setSubmitting(true)
    try {
      if (modalMode === 'create') {
        await userApi.createUser(payload as UserCreatePayload)
        message.success('新增成功')
        // 新用户插入列表头部，回第一页查看；已是第一页时直接刷新
        if (page === 1) void loadList()
        else setPage(1)
      } else {
        await userApi.updateUser(editingRecord!.id, payload as UserUpdatePayload)
        message.success('保存成功')
        void loadList()
      }
      setModalOpen(false)
    } catch {
      // 错误提示由 request 层全局处理
    } finally {
      setSubmitting(false)
    }
  }

  /** 单条删除 */
  const handleDelete = async (record: UserRecord) => {
    try {
      await userApi.deleteUser(record.id)
      message.success('删除成功')
      setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id))
      // 删空当前页且非第一页时回退一页，否则原地刷新
      if (data.list.length === 1 && page > 1) setPage(page - 1)
      else void loadList()
    } catch {
      // 全局提示
    }
  }

  /** 批量删除 */
  const handleBatchDelete = async () => {
    try {
      const res = await userApi.batchDeleteUsers(selectedRowKeys.map(String))
      message.success(`已删除 ${res.removed} 个用户`)
      setSelectedRowKeys([])
      if (data.list.length === selectedRowKeys.length && page > 1) setPage(page - 1)
      else void loadList()
    } catch {
      // 全局提示
    }
  }

  /** 状态启停切换 */
  const handleToggleStatus = async (record: UserRecord, status: UserStatus) => {
    setSwitchingId(record.id)
    try {
      await userApi.updateUserStatus(record.id, status)
      message.success(status === 'enabled' ? `已启用「${record.username}」` : `已停用「${record.username}」`)
      void loadList()
    } catch {
      // 全局提示
    } finally {
      setSwitchingId(null)
    }
  }

  return (
    <Card>
      {/* 条件查询栏 */}
      <Form<SearchFormValues> form={searchForm} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item name="keyword" label="关键字">
          <Input
            placeholder="用户名 / 昵称 / 邮箱 / 手机号"
            allowClear
            style={{ width: 240 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="全部"
            allowClear
            style={{ width: 110 }}
            options={[
              { value: 'enabled', label: '启用' },
              { value: 'disabled', label: '停用' },
            ]}
          />
        </Form.Item>
        <Form.Item name="role" label="角色">
          <Select
            placeholder="全部"
            allowClear
            style={{ width: 110 }}
            options={[
              { value: 'admin', label: '管理员' },
              { value: 'user', label: '普通用户' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 操作区 */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          新增用户
        </Button>
        <Popconfirm
          title="确认删除选中的用户？"
          description={`共 ${selectedRowKeys.length} 个用户将被删除，该操作不可恢复`}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          disabled={selectedRowKeys.length === 0}
          onConfirm={() => void handleBatchDelete()}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
          >
            批量删除{selectedRowKeys.length > 0 ? `（${selectedRowKeys.length}）` : ''}
          </Button>
        </Popconfirm>
      </Space>

      {/* 表格 */}
      <UserTable
        data={data.list}
        loading={loading}
        total={data.total}
        page={page}
        pageSize={pageSize}
        selectedRowKeys={selectedRowKeys}
        switchingId={switchingId}
        onPageChange={handlePageChange}
        onSelectionChange={setSelectedRowKeys}
        onEdit={handleOpenEdit}
        onDelete={(record) => void handleDelete(record)}
        onToggleStatus={(record, status) => void handleToggleStatus(record, status)}
      />

      {/* 新增 / 编辑弹窗 */}
      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        record={editingRecord}
        submitting={submitting}
        onCancel={() => setModalOpen(false)}
        onSubmit={(payload) => void handleSubmit(payload)}
      />
    </Card>
  )
}
