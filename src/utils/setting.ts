import type { settingInterface } from '@/types/setting.type'

export const setting: settingInterface = {
  title: 'pipleline版本自动管理', // 系统名称
  baseUrl: '/', // 生产环境api基础路径
  devBaseUrl: '/api', // 非生产环境api基础路径
  TokenKey: 'Admin-Token', // token在cookie里的key名
  routerKey: 'Admin-Router', // localstorage 存储路由对象的key名
  pagePermission: false, // 是否开启页面权限 false: 关闭 true: 打开
  btnPermissionBoolean: true, // 是否开启按钮权限 必须开启页面权限生效 false: 关闭 true: 打开
  multipleTabs: true // 是否开启多标签页导航 如果开启多标签页则路由变化时不取消上个路由的ajax请求 false: 关闭 true: 打开
}