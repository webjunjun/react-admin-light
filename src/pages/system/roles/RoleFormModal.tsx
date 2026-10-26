import { useEffect, useMemo, useState } from 'react'
import type { Key, ReactNode } from 'react'
import { Button, Form, Input, InputNumber, Modal, Radio, Space, Spin, Tag, Tree } from 'antd'
import type { TreeProps } from 'antd'

import type {
  PermissionNode,
  RoleCreatePayload,
  RoleRecord,
  RoleStatus,
  RoleUpdatePayload,
} from '@/types/role'

/** 新增 / 编辑共用弹窗表单 */
interface RoleFormModalProps {
  open: boolean
  /** create：新增；edit：编辑 */
  mode: 'create' | 'edit'
  /** 编辑回显数据（create 模式下为 null） */
  record: RoleRecord | null
  /** 提交中（确认按钮 loading） */
  submitting: boolean
  /** 权限树数据（来自 GET /permissions/menus） */
  treeData: PermissionNode[]
  /** 权限树加载中 */
  treeLoading: boolean
  onCancel: () => void
  /** create 传 RoleCreatePayload；edit 传 RoleUpdatePayload（不含 code） */
  onSubmit: (payload: RoleCreatePayload | RoleUpdatePayload) => void
}

interface FormValues {
  name: string
  code: string
  status: RoleStatus
  sort: number
  remark?: string
}

/** 校验规则：角色编码 2-32 位，小写字母开头，仅含小写字母/数字/下划线/短横线 */
const CODE_PATTERN = /^[a-z][a-z0-9_-]{1,31}$/

/** antd Tree 节点（key/title 由权限树映射而来） */
interface RoleTreeNode {
  key: string
  title: ReactNode
  children?: RoleTreeNode[]
}

/** 拍平权限树取全部 id（弹窗内全选用） */
function collectAllIds(nodes: PermissionNode[]): string[] {
  const ids: string[] = []
  nodes.forEach((node) => {
    ids.push(node.id)
    if (node.children) ids.push(...collectAllIds(node.children))
  })
  return ids
}

/** 收集含子节点的分组 id（默认展开） */
function collectParentIds(nodes: PermissionNode[]): string[] {
  const ids: string[] = []
  nodes.forEach((node) => {
    if (node.children?.length) {
      ids.push(node.id)
      ids.push(...collectParentIds(node.children))
    }
  })
  return ids
}

/** 权限树 → antd Tree 数据（按钮节点加 Tag 区分） */
function toTreeNodes(nodes: PermissionNode[]): RoleTreeNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: (
      <Space size={6}>
        <span>{node.name}</span>
        {node.type === 'button' && <Tag color="blue">按钮</Tag>}
      </Space>
    ),
    children: node.children ? toTreeNodes(node.children) : undefined,
  }))
}

export default function RoleFormModal({
  open,
  mode,
  record,
  submitting,
  treeData,
  treeLoading,
  onCancel,
  onSubmit,
}: RoleFormModalProps) {
  const [form] = Form.useForm<FormValues>()
  // 勾选的权限点 id（checkStrictly：父子不联动，菜单节点本身即「页面访问权」）
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  const treeNodes = useMemo(() => toTreeNodes(treeData), [treeData])
  const allIds = useMemo(() => collectAllIds(treeData), [treeData])

  // 打开时数据回显（edit）/ 重置为默认（create）；权限树默认全展开
  useEffect(() => {
    if (!open) return
    setExpandedKeys(collectParentIds(treeData))
    if (mode === 'edit' && record) {
      form.setFieldsValue({
        name: record.name,
        code: record.code,
        status: record.status,
        sort: record.sort,
        remark: record.remark,
      })
      setCheckedKeys(record.menuIds)
    } else {
      form.resetFields()
      setCheckedKeys([])
    }
  }, [open, mode, record, form, treeData])

  const handleCheck: TreeProps['onCheck'] = (checked) => {
    // checkStrictly 下为 { checked, halfChecked }；兼容数组形态，统一 String 化
    const keys: Key[] = Array.isArray(checked) ? checked : checked.checked
    setCheckedKeys(keys.map(String))
  }

  const handleOk = async () => {
    let values: FormValues
    try {
      values = await form.validateFields()
    } catch {
      // 校验失败：错误信息由 Form.Item 就地展示，无需额外提示
      return
    }

    const base = {
      name: values.name.trim(),
      status: values.status,
      sort: values.sort ?? 0,
      remark: values.remark?.trim() || undefined,
      menuIds: checkedKeys,
    }

    if (mode === 'create') {
      const payload: RoleCreatePayload = {
        ...base,
        code: values.code.trim(),
      }
      onSubmit(payload)
      return
    }

    // 编辑：code 不可修改，仅提交可编辑字段
    const payload: RoleUpdatePayload = base
    onSubmit(payload)
  }

  return (
    <Modal
      title={mode === 'create' ? '新增角色' : '编辑角色'}
      open={open}
      onOk={() => void handleOk()}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText="确定"
      cancelText="取消"
      maskClosable={false}
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark>
        <Form.Item
          name="name"
          label="角色名称"
          rules={[
            { required: true, message: '请输入角色名称' },
            { max: 20, message: '角色名称最长 20 个字符' },
          ]}
        >
          <Input placeholder="请输入角色名称" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="code"
          label="角色编码"
          extra="创建后不可修改；用于与用户账号关联，建议小写英文，如 ops"
          rules={[
            { required: true, message: '请输入角色编码' },
            { pattern: CODE_PATTERN, message: '2-32 位，小写字母开头，仅含小写字母、数字、下划线、短横线' },
          ]}
        >
          <Input placeholder="请输入角色编码" disabled={mode === 'edit'} maxLength={32} />
        </Form.Item>

        <Space size={24} align="start">
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Radio.Group
              options={[
                { value: 'enabled', label: '启用' },
                { value: 'disabled', label: '停用' },
              ]}
            />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} max={9999} precision={0} style={{ width: 120 }} />
          </Form.Item>
        </Space>

        <Form.Item
          label="菜单权限"
          tooltip="菜单节点控制页面访问与侧边栏可见性；按钮节点为操作级权限预留，本期只录入不拦截"
        >
          <Spin spinning={treeLoading}>
            <Space style={{ marginBottom: 8 }} size={4}>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setCheckedKeys(allIds)}>
                全选
              </Button>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setCheckedKeys([])}>
                清空
              </Button>
            </Space>
            <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6, padding: '8px 12px' }}>
              <Tree
                checkable
                checkStrictly
                checkedKeys={checkedKeys}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys.map(String))}
                onCheck={handleCheck}
                treeData={treeNodes}
              />
            </div>
          </Spin>
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <Input.TextArea placeholder="请输入备注（可选）" maxLength={200} rows={2} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
