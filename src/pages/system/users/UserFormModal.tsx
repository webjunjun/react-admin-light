import { useEffect } from 'react'
import { Form, Input, Modal, Radio, Select } from 'antd'

import type { UserRole } from '@/stores/user'
import type {
  UserCreatePayload,
  UserRecord,
  UserStatus,
  UserUpdatePayload,
} from '@/types/user'

/** 新增 / 编辑共用弹窗表单 */
interface UserFormModalProps {
  open: boolean
  /** create：新增；edit：编辑 */
  mode: 'create' | 'edit'
  /** 编辑回显数据（create 模式下为 null） */
  record: UserRecord | null
  /** 提交中（确认按钮 loading） */
  submitting: boolean
  onCancel: () => void
  /** create 传 UserCreatePayload；edit 传 UserUpdatePayload（不含 username） */
  onSubmit: (payload: UserCreatePayload | UserUpdatePayload) => void
}

interface FormValues {
  username: string
  nickname: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  remark?: string
}

/** 校验规则：用户名 3-20 位字母数字下划线 */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/
/** 校验规则：大陆手机号 */
const PHONE_PATTERN = /^1[3-9]\d{9}$/

export default function UserFormModal({
  open,
  mode,
  record,
  submitting,
  onCancel,
  onSubmit,
}: UserFormModalProps) {
  const [form] = Form.useForm<FormValues>()

  // 打开时数据回显（edit）/ 重置为默认（create）
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && record) {
      form.setFieldsValue({
        username: record.username,
        nickname: record.nickname,
        email: record.email,
        phone: record.phone,
        role: record.role,
        status: record.status,
        remark: record.remark,
      })
    } else {
      form.resetFields()
    }
  }, [open, mode, record, form])

  const handleOk = async () => {
    let values: FormValues
    try {
      values = await form.validateFields()
    } catch {
      // 校验失败：错误信息由 Form.Item 就地展示，无需额外提示
      return
    }

    if (mode === 'create') {
      const payload: UserCreatePayload = {
        ...values,
        username: values.username.trim(),
        nickname: values.nickname.trim(),
        remark: values.remark?.trim() || undefined,
      }
      onSubmit(payload)
      return
    }

    // 编辑：username 不可修改，仅提交可编辑字段
    const { username: _username, ...editable } = values
    const payload: UserUpdatePayload = {
      ...editable,
      nickname: editable.nickname.trim(),
      remark: editable.remark?.trim() || undefined,
    }
    onSubmit(payload)
  }

  return (
    <Modal
      title={mode === 'create' ? '新增用户' : '编辑用户'}
      open={open}
      onOk={() => void handleOk()}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText="确定"
      cancelText="取消"
      maskClosable={false}
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark>
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { pattern: USERNAME_PATTERN, message: '3-20 位字母、数字或下划线' },
          ]}
        >
          <Input placeholder="请输入用户名" disabled={mode === 'edit'} maxLength={20} />
        </Form.Item>

        <Form.Item
          name="nickname"
          label="昵称"
          rules={[
            { required: true, message: '请输入昵称' },
            { max: 20, message: '昵称最长 20 个字符' },
          ]}
        >
          <Input placeholder="请输入昵称" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input placeholder="请输入邮箱" maxLength={64} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: PHONE_PATTERN, message: '手机号格式不正确' },
          ]}
        >
          <Input placeholder="请输入手机号" maxLength={11} />
        </Form.Item>

        <Form.Item
          name="role"
          label="角色"
          rules={[{ required: true, message: '请选择角色' }]}
        >
          <Select
            placeholder="请选择角色"
            options={[
              { value: 'admin', label: '管理员' },
              { value: 'user', label: '普通用户' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Radio.Group
            options={[
              { value: 'enabled', label: '启用' },
              { value: 'disabled', label: '停用' },
            ]}
          />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <Input.TextArea placeholder="请输入备注（可选）" maxLength={200} rows={2} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
