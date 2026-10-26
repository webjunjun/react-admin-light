import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Key } from 'react'
import { App, Button, Card, Form, Input, Popconfirm, Select, Space } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'

import { permissionApi, roleApi } from '@/api/modules/role'
import { useActivated } from '@/hooks/useKeepAliveLifecycle'
import type {
  PageResult,
  PermissionNode,
  RoleCreatePayload,
  RoleQuery,
  RoleRecord,
  RoleStatus,
  RoleUpdatePayload,
} from '@/types/role'

import RoleFormModal from './RoleFormModal'
import RoleTable from './RoleTable'

/** 查询表单值 */
interface SearchFormValues {
  keyword?: string
  status?: RoleStatus
}

/** 空查询条件（重置用） */
const EMPTY_QUERY: Required<Pick<RoleQuery, 'keyword' | 'status'>> = {
  keyword: '',
  status: '',
}

/** 拍平权限树构建 id → name 映射（表格权限列 Tooltip 用） */
function buildPermissionNameMap(nodes: PermissionNode[]): Map<string, string> {
  const map = new Map<string, string>()
  const walk = (list: PermissionNode[]) => {
    list.forEach((node) => {
      map.set(node.id, node.name)
      if (node.children) walk(node.children)
    })
  }
  walk(nodes)
  return map
}

/**
 * 角色管理页（RBAC：角色 CRUD + 菜单权限授权）
 * - 列表分页 + 关键字/状态条件查询
 * - 新增 / 编辑弹窗（编码唯一且创建后不可改；Tree 勾选菜单/按钮权限）
 * - 单条删除 / 批量删除（内置角色禁删；仍被用户引用时后端拒绝）
 * - 状态启停切换（内置角色禁停）
 * - 授权结果经登录态 permissions 驱动菜单可见性与路由守卫（见 auth mock / guards）
 * - 多标签页适配：页签从缓存切回（非首次挂载）时自动刷新列表
 */
export default function SystemRoles() {
  const { message } = App.useApp()
  const [searchForm] = Form.useForm<SearchFormValues>()

  // 查询条件（查询/重置时更新，驱动列表重新加载）
  const [query, setQuery] = useState<Required<Pick<RoleQuery, 'keyword' | 'status'>>>(EMPTY_QUERY)
  // 分页
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  // 列表数据
  const [data, setData] = useState<PageResult<RoleRecord>>({ list: [], total: 0, page: 1, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  // 行选择（批量删除）
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  // 行级状态切换 loading
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingRecord, setEditingRecord] = useState<RoleRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // 权限树（首次打开弹窗时懒加载，之后复用）
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const treeLoadedRef = useRef(false)

  const permissionNameMap = useMemo(
    () => buildPermissionNameMap(permissionTree),
    [permissionTree],
  )

  /** 加载权限树（仅首次） */
  const loadPermissionTree = useCallback(async () => {
    if (treeLoadedRef.current) return
    treeLoadedRef.current = true
    setTreeLoading(true)
    try {
      const tree = await permissionApi.getMenuTree()
      setPermissionTree(tree)
    } catch {
      treeLoadedRef.current = false
      // 错误提示由 request 层全局处理
    } finally {
      setTreeLoading(false)
    }
  }, [])

  /** 加载列表（query / page / pageSize 变化时由 useEffect 触发） */
  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await roleApi.getRoleList({
        page,
        pageSize,
        keyword: query.keyword || undefined,
        status: query.status || undefined,
      })
      setData(res)
      // 当前页被删空且非第一页时，回退一页（setPage 触发 deps 变化再次加载）
      if (res.list.length === 0 && res.page > 1) {
        setPage(res.page - 1)
      }
    } catch {
      // 错误提示由 request 层全局处理
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, query])

  // 多标签页适配：effect 提交同步最新引用后立即拉取
  const loadListRef = useRef(loadList)
  useEffect(() => {
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
    void loadPermissionTree()
  }

  /** 打开编辑弹窗（数据回显） */
  const handleOpenEdit = (record: RoleRecord) => {
    setModalMode('edit')
    setEditingRecord(record)
    setModalOpen(true)
    void loadPermissionTree()
  }

  /** 弹窗提交（新增 / 编辑统一入口） */
  const handleSubmit = async (payload: RoleCreatePayload | RoleUpdatePayload) => {
    setSubmitting(true)
    try {
      if (modalMode === 'create') {
        await roleApi.createRole(payload as RoleCreatePayload)
        message.success('新增成功')
        if (page === 1) void loadList()
        else setPage(1)
      } else {
        await roleApi.updateRole(editingRecord!.id, payload as RoleUpdatePayload)
        message.success('保存成功')
        void loadList()
      }
      setModalOpen(false)
    } catch {
      // 错误提示由 request 层全局处理（编码重复 / 内置角色保护等）
    } finally {
      setSubmitting(false)
    }
  }

  /** 单条删除 */
  const handleDelete = async (record: RoleRecord) => {
    try {
      await roleApi.deleteRole(record.id)
      message.success('删除成功')
      setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id))
      if (data.list.length === 1 && page > 1) setPage(page - 1)
      else void loadList()
    } catch {
      // 全局提示（内置角色 / 角色被用户引用等保护由后端返回）
    }
  }

  /** 批量删除 */
  const handleBatchDelete = async () => {
    try {
      const res = await roleApi.batchDeleteRoles(selectedRowKeys.map(String))
      message.success(`已删除 ${res.removed} 个角色`)
      setSelectedRowKeys([])
      if (data.list.length === selectedRowKeys.length && page > 1) setPage(page - 1)
      else void loadList()
    } catch {
      // 全局提示
    }
  }

  /** 状态启停切换 */
  const handleToggleStatus = async (record: RoleRecord, status: RoleStatus) => {
    setSwitchingId(record.id)
    try {
      await roleApi.updateRoleStatus(record.id, status)
      message.success(status === 'enabled' ? `已启用「${record.name}」` : `已停用「${record.name}」`)
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
            placeholder="角色名称 / 编码"
            allowClear
            style={{ width: 220 }}
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
          新增角色
        </Button>
        <Popconfirm
          title="确认删除选中的角色？"
          description={`共 ${selectedRowKeys.length} 个角色将被删除，该操作不可恢复`}
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
      <RoleTable
        data={data.list}
        loading={loading}
        total={data.total}
        page={page}
        pageSize={pageSize}
        selectedRowKeys={selectedRowKeys}
        switchingId={switchingId}
        permissionNameMap={permissionNameMap}
        onPageChange={handlePageChange}
        onSelectionChange={setSelectedRowKeys}
        onEdit={handleOpenEdit}
        onDelete={(record) => void handleDelete(record)}
        onToggleStatus={(record, status) => void handleToggleStatus(record, status)}
      />

      {/* 新增 / 编辑弹窗 */}
      <RoleFormModal
        open={modalOpen}
        mode={modalMode}
        record={editingRecord}
        submitting={submitting}
        treeData={permissionTree}
        treeLoading={treeLoading}
        onCancel={() => setModalOpen(false)}
        onSubmit={(payload) => void handleSubmit(payload)}
      />
    </Card>
  )
}
