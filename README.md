# React Admin Light

仅基础初始化：无业务逻辑。已内置**路由底层能力**（History 模式 + 路由级懒加载 + 鉴权守卫）、**登录闭环**（表单校验 / authApi 登录 / token·用户·角色一次写入 / 顶栏退出登录）、404 页、**Zustand 用户状态存储**与 **Axios 请求层封装**（token 携带 / 统一错误处理 / blob 文件下载）、**MSW Mock**（含认证域）、**antd6 后台布局与角色权限**、基于 **keepalive-for-react 的路由多标签页缓存系统**（页签持久化 / LRU 防内存泄漏 / 生命周期 hooks），以及首个完整业务模块 **用户管理**（列表分页查询 / 新增编辑弹窗校验 / 单条与批量删除 / 状态启停）。

## 版本

| 依赖 | 版本 |
| --- | --- |
| react / react-dom | ^19.2.8 |
| vite | ^8.2.2 |
| typescript（TS6 API 垫片，供 ESLint） | npm:@typescript/typescript6 ^6.0.2 |
| @typescript/native（TS7，tsc 本体） | npm:typescript ^7.0.2 |
| @vitejs/plugin-react | ^6.1.1 |
| react-router-dom | ^7.18.3 |
| zustand | ^5.0.15 |
| axios | ^1.20.0 |
| antd / @ant-design/icons | ^6.6.3 / ^6.3.4 |
| keepalive-for-react | ^5.0.11 |
| msw（dev） | ^2.15.0 |
| eslint / typescript-eslint（dev） | ^10.12.0 / ^8.70.0 |
| eslint-plugin-react-hooks / react-refresh（dev） | ^7.1.1 / ^0.5.7 |

> 要求 Node.js `^20.19.0 || >=22.12.0`（Vite 8 官方要求）

## 命令

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查
npm run type-check

# ESLint 检查 / 自动修复
npm run lint
npm run lint:fix

# 生产构建
npm run build

# 预览生产构建产物
npm run preview
```

## 目录结构

```
├── index.html                  # 入口 HTML
├── vite.config.ts              # Vite 配置（含 @ 别名）
├── tsconfig.json               # TS 项目引用
├── tsconfig.app.json           # 应用代码 TS 配置
├── tsconfig.node.json          # Vite 配置 TS 配置
├── .env.development            # 开发环境变量模板
├── .env.production             # 生产环境变量模板
├── public/
│   └── mockServiceWorker.js    # MSW Service Worker（msw init 生成）
└── src/
    ├── main.tsx                # React 入口（RouterProvider 挂载 + Mock 开关启用；已移除 StrictMode，keepalive-for-react 官方要求）
    ├── vite-env.d.ts           # Vite 客户端类型
    ├── env.d.ts                # 环境变量类型声明
    ├── mocks/                  # MSW Mock（见模块内 README）
    │   ├── browser.ts          # setupWorker 初始化
    │   ├── handlers/           # 接口 handlers（按业务域分文件）
    │   │   ├── index.ts
    │   │   └── user.ts         # 用户域：分页查询/CRUD/批量删除/状态启停（REST 规范）
    │   └── data/               # mock 数据模板
    │       └── user.ts         # 35 条确定性用户数据（内存 mock 数据库，增删改真实生效）
    ├── router/
    │   ├── index.tsx           # createBrowserRouter（History 模式）+ 基础路由表 + 懒加载
    │   ├── guards.tsx          # 路由守卫（RequireAuth / GuestOnly，纯鉴权逻辑）
    │   └── menu.tsx            # 侧边菜单配置（key=路由 path，roles 角色白名单）
    ├── layouts/
    │   └── AdminLayout/        # 企业级后台布局：侧边菜单 + 顶栏 + 面包屑 + 多标签页 + Outlet
    │       ├── index.tsx       # KeepAlive 集成：activeCacheKey=pathname+search、LRU、登出销毁全部缓存
    │       ├── TabsBar.tsx     # 多标签页栏：自动加签 / 右键菜单（刷新/关闭当前/其他/左/右）
    │       ├── TabsBar.module.css
    │       └── index.module.css
    ├── api/                     # 接口层
    │   ├── request.ts           # axios 封装：拦截器 / 错误处理 / blob 下载
    │   └── modules/             # 业务接口模块（按域分文件）
    │       ├── auth.ts          # 认证域接口（authApi.login）
    │       └── user.ts          # 用户域接口（userApi：list/create/update/status/delete/batch）
    ├── assets/                 # 静态资源
    ├── components/             # 通用组件
    ├── constants/              # 常量
    │   └── keepalive.ts         # 多标签页缓存常量（MAX_TABS / MAX_ALIVE_TIME）
    ├── hooks/                  # 自定义 Hooks
    │   └── useKeepAliveLifecycle.ts  # useActivated / useUnactivated 生命周期封装
    ├── pages/                  # 页面（路由懒加载目标，默认导出组件）
    │   ├── home/index.tsx      # 工作台（占位页，布局导航演示）
    │   ├── login/              # 登录页（表单校验 / authApi 登录 / 写 store / 跳转 / 演示账号提示）
    │   │   ├── index.tsx
    │   │   └── index.module.css
    │   ├── system/             # 系统管理
    │   │   ├── users/          # 用户管理（完整业务 CRUD 模块，干净分层）
    │   │   │   ├── index.tsx        # 页面容器：查询栏 + 操作区 + 状态编排 + 多标签页适配
    │   │   │   ├── UserTable.tsx    # 列表表格：分页/行选择/状态开关/行操作
    │   │   │   └── UserFormModal.tsx# 新增/编辑共用弹窗（表单校验 + 数据回显）
    │   │   └── settings/index.tsx
    │   └── not-found/          # 404 页（纯静态 UI，/404 与通配兜底共用）
    │       ├── index.tsx
    │       └── index.module.css
    ├── services/               # 服务（预留，接口统一放 api/modules）
    ├── stores/                  # 状态管理（Zustand）
    │   ├── user.ts              # 用户 Store：token / 用户信息 / 角色 / 清空 + localStorage 持久化
    │   └── tabs.ts              # 多标签页 Store：add/remove/removeOther/Left/Right/clear + sessionStorage 持久化
    ├── styles/                 # 全局样式
    ├── types/                  # 类型定义
    │   └── user.ts             # 用户域全套类型（UserRecord/UserQuery/PageResult/各 Payload，单一数据源）
    └── utils/                  # 工具函数
```
## 路由与守卫
- **History 模式**：`createBrowserRouter`（HTML5 History API，URL 无 `#`）
- **路由出口**：根路由 `element: <Outlet />`，子路由渲染于此
- **懒加载**：路由级代码分割（`lazy: () => import(...)`），命中才加载 chunk
- **守卫**（`src/router/guards.tsx`）：
  - `RequireAuth`：未登录访问受保护页面 → 跳转 `/login`
  - `GuestOnly`：已登录访问 `/login` → 跳转首页 `/`
  - 登录态取自 `useUserStore.token`（localStorage 持久化，刷新不丢失）
- 已注册路由：

| 路径 | 页面 | 守卫/布局 |
| --- | --- | --- |
| `/`（工作台） | home | RequireAuth → AdminLayout |
| `/dashboard` | home（工作台） | RequireAuth → AdminLayout |
| `/system/users` | system/users | RequireAuth → AdminLayout（仅管理员菜单可见） |
| `/system/settings` | system/settings | RequireAuth → AdminLayout |
| `/login` | login | GuestOnly（已登录 → /） |
| `/404` | not-found | 公开 |
| `*` | not-found | 公开（非法路由统一兜底 404） |

- 新增受保护页面：`src/pages` 下建目录默认导出组件，在 `AdminLayout` 的 children 中注册路由，并在 `src/router/menu.tsx` 添加对应菜单项（key 与 path 一致）；游客/公开页面分别放入 `GuestOnly` 或根 children
- 生产部署需将任意路径回退到 `index.html`（如 nginx `try_files $uri $uri/ /index.html`）

## 登录闭环

登录页（`src/pages/login`）从纯静态 UI 升级为完整登录逻辑，不改动布局/守卫/存储底层：

- **表单校验**：提交时前端校验（用户名/密码必填，`message.warning` 提示）；后端仍兜底校验（账号不存在或密码错误 → 全局 `message.error`「用户名或密码错误」）
- **请求**：`authApi.login`（`src/api/modules/auth.ts`，POST `/auth/login`）走已封装 axios + MSW mock
- **写登录态**：成功后 `token` / `userInfo` / `role` **一次原子写入** `useUserStore`（persist 自动持久化到 localStorage，刷新不丢）
- **跳转**：`navigate('/', { replace: true })` 进工作台（GuestOnly 守卫兜底，已登录再访问 /login 会被重定向回首页）
- **loading 防重**：提交中禁用表单与按钮（`submitting`），避免重复提交
- **顶栏退出登录**：`AdminLayout` 用户区改 Dropdown（头像+用户名 → 退出登录），调用 `clearUserInfo()` 清 token/userInfo/角色并**联动清空全部页签缓存**，提示后跳回 /login
- **演示账号**（Mock 环境，密码统一 `123456`）：

| 账号 | 角色 | 菜单差异 |
| --- | --- | --- |
| admin | 系统管理员（独立账号，不在用户数据池） | 全部菜单 |
| user02 | 普通用户（users 数据池） | 隐藏"用户管理" |

## 后台布局与权限（antd6）

- **布局**（`src/layouts/AdminLayout`）：经典企业后台结构 —— 暗色可折叠侧边菜单 + 白色顶栏（折叠按钮 / 用户信息 / 角色标签）+ 面包屑 + 内容区 `<Outlet />`
- **菜单动态渲染**（`src/router/menu.tsx`）：菜单配置为唯一数据源（key = 路由 path，点击即导航）；`filterMenusByRole` 按角色过滤，子菜单全不可见时父菜单一并隐藏
- **面包屑**：`findMenuPath` 按当前路径匹配菜单链路，自动生成「首页 / 分组 / 页面」层级
- **角色权限**（zustand）：`useUserStore.role`（`'admin' | 'user'`）+ `setRole`，持久化于 localStorage；菜单 `roles` 白名单控制可见性 —— 管理员可见全部菜单，普通用户隐藏"用户管理"
- 仅布局框架与权限基础能力；角色仅作菜单可见性控制，不联动登录逻辑

## 用户管理模块（完整业务 CRUD）

首个完整业务模块（`src/pages/system/users/`，管理员可见），数据层走 `userApi`（axios 封装 + MSW mock），不改动任何底层框架。

- **分层**：`index.tsx`（页面容器：查询栏/操作区/状态编排/事件）→ `UserTable.tsx`（表格：分页/行选择/状态开关/行操作）→ `UserFormModal.tsx`（新增/编辑共用弹窗）
- **类型**：`src/types/user.ts` 全套严格类型（`UserRecord` / `UserQuery` / `PageResult<T>` / `UserCreatePayload` / `UserUpdatePayload` / `UserBatchDeletePayload` / `UserStatusPayload`），api 层、mock 层、页面共用同一数据源
- **列表**：分页（page/pageSize）+ 条件查询（关键字模糊匹配用户名/昵称/邮箱/手机号、状态筛选、角色筛选）
- **新增/编辑**：共用弹窗表单，`rules` 校验（必填/用户名格式/邮箱格式/手机号正则）；编辑模式用户名只读、数据全字段回显
- **删除**：单条删除 + 批量删除（行勾选 + Popconfirm 二次确认），删除后当前页删空自动回退上一页
- **状态启停**：Switch 行级 `loading`，PATCH 切换后刷新列表
- **接口**（`src/api/modules/user.ts`，REST 规范）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/users` | 分页 + 条件查询 |
| POST | `/users` | 创建用户（用户名唯一校验） |
| PUT | `/users/:id` | 更新用户（username 不可改） |
| PATCH | `/users/:id/status` | 状态启停切换 |
| DELETE | `/users/:id` | 删除单个用户 |
| DELETE | `/users` | 批量删除（body: `{ ids }`） |

- **Mock**：`src/mocks/handlers/user.ts` 补齐上述全部接口；`src/mocks/data/user.ts` 提供 35 条确定性数据，增删改**直接操作内存数组**（页面 CRUD 后刷新列表可见真实变化）
- **错误提示**：`main.tsx` 新增 `NotifyBridge`，将 `request.ts` 预留的 `setNotifyError` 注入 antd message（页面与全局错误提示统一）
- **多标签页适配**：页面状态（查询条件/列表数据/分页）被 KeepAlive 缓存，SPA 内切页签状态完整保留；`useActivated(..., [], true)` 在页签从缓存切回（非首次挂载）时自动刷新列表，保证数据最新

## 多标签页缓存（keepalive-for-react）

基于 `keepalive-for-react@5.x`（官方适配 React 19；**禁止与 `<StrictMode>` 同用**，`main.tsx` 已移除并注释说明）实现路由级组件缓存，页面切走不销毁、切回状态保留。

- **自动加签**：路由变化自动新增页签（`src/layouts/AdminLayout/index.tsx` 中监听 location 同步 `useTabsStore`）；`/` 工作台为固定页签（不可关闭）；页签**按打开顺序排列**，激活已有页签不重排，位置稳定
- **tab key = pathname + search**：`/system/users?id=1` 与 `?id=2` 各自独立页签、独立缓存，详情页多参数互不串扰。取舍：列表页若把筛选/分页参数写进 URL，每次筛选都会新增页签（由 `MAX_TABS` 上限兜底）
- **同名页签区分**：多个详情页共用一个菜单标题时，页签标题自动追加后缀（优先查询串，其次路径末段）；hover 显示完整 `pathname + search`
- **右键菜单**（`TabsBar.tsx`，antd Tabs editable-card + Dropdown）：刷新页签 / 关闭当前 / 关闭其他 / 关闭左侧 / 关闭右侧；关闭动作同步调用 `aliveRef.current.destroy(key)` 销毁对应缓存实例，关闭当前页签自动导航相邻页签；**关闭其他/左/右 若把当前页签一并移除，会自动回退导航到锚点页签**（避免 activeKey 悬空、内容区空白）
- **持久化**：页签列表经 zustand `persist` 存入 `sessionStorage`（key：`app-tabs`），刷新页面页签不丢失（组件缓存本身随会话重建）；仅持久化页签列表，最近激活顺序为内存态不入存储
- **LRU 防内存泄漏**：上限 `MAX_TABS`（`src/constants/keepalive.ts`，默认 10）。淘汰对象由 `useTabsStore` 的最近激活顺序（`recentKeys`）选出 —— 优先淘汰未激活过的页签，其次淘汰最久未激活的可关闭页签（固定页签不参与）；`KeepAlive max = MAX_TABS` 作为同源兜底，两者指向同一个待淘汰页签，避免"页签与缓存淘汰的不是同一个"导致状态静默丢失。`maxAliveTime` 实际取 `MAX_ALIVE_TIME = 0`（不超时回收，缓存生命周期只由关闭/淘汰决定）
- **生命周期**：`src/hooks/useKeepAliveLifecycle.ts` 封装 `useActivated`（对应 v5 `useEffectOnActive`，切回时触发）与 `useUnactivated`（基于 `useKeepAliveContext().active` 由 true→false 触发），供页面感知"被激活/被失活"
- **登出清空**：`useUserStore.clearUserInfo()` 联动 `useTabsStore.clearTabs()`，并调用 `aliveRef.current?.destroyAll()` 销毁全部缓存实例

```ts
import { useActivated, useUnactivated } from '@/hooks/useKeepAliveLifecycle'

useActivated(() => { /* 页签切回时触发（含首次挂载） */ })
useUnactivated(() => { /* 页签切走时触发 */ })
```

## 状态管理（Zustand）

- `useUserStore`（`src/stores/user.ts`）：`token` / `userInfo` / `role` / `setToken` / `setUserInfo` / `setRole` / `clearUserInfo`
- `persist` 中间件自动同步到 `localStorage`（key：`user-storage`），刷新后自动恢复
- 仅存储能力，不联动登录逻辑、不做路由跳转

```ts
import { useUserStore } from '@/stores/user'

const { setToken, setUserInfo, setRole, clearUserInfo } = useUserStore.getState()

setToken('your-token')
setUserInfo({ id: '1', username: 'alice' })
setRole('admin') // 菜单可见性控制：'admin' 全量 / 'user' 隐藏仅管理员菜单
clearUserInfo() // 清空 token 与 userInfo，角色重置为 'user'
```

## 网络请求（Axios，`src/api/request.ts`）

- **baseURL**：统一读取环境变量 `VITE_API_BASE_URL`（.env.development / .env.production）
- **超时**：统一读取 `VITE_API_TIMEOUT`（毫秒，缺省 15000）
- **请求拦截器**：自动从 `useUserStore` 携带 `Authorization: Bearer <token>`
- **响应拦截器**：业务码解包直接返回 `data`；业务失败/HTTP 异常/超时统一错误提示（`setNotifyError` 可注入 UI 提示）；401 自动清空登录态（路由守卫跳转 /login）
- **blob 下载**：`downloadFile` 支持后端文件导出，自动解析 `Content-Disposition` 文件名（优先 `filename*` UTF-8），导出失败返回 JSON 时自动报错
- **静默请求**：`silent: true` 出错时不弹全局提示（轮询等场景）

```ts
import { downloadFile, request } from '@/api/request'

// JSON 请求（自动携带 token，直接拿到业务 data）
const userInfo = await request<UserInfo>({ url: '/user/info', method: 'get' })

// 文件导出下载（GET/POST 均可，自动解析文件名）
await downloadFile('/report/export', { method: 'post', data: { id: 1 } })
```

业务接口按域放入 `src/api/modules/`（预留分层），禁止在组件中直接 new axios。

## Mock（MSW）

- **开关**：环境变量 `VITE_USE_MOCK`，`true` 启用；`.env.development` 默认 `true`（开发自动开启），`.env.production` 固定 `false`（生产自动关闭，构建时按条件剔除 mock 代码）
- **启用点**：`src/main.tsx` 按开关动态 `import('@/mocks/browser')` 并 `worker.start()`，未匹配请求放行（`onUnhandledRequest: 'bypass'`）
- **结构**：`src/mocks/browser.ts`（setupWorker）+ `handlers/`（按业务域分文件：`auth.ts` 认证域 / `user.ts` 用户域，REST 规范）+ `data/`（数据模板）
- **REST 规范**：资源复数路径（`/api/auth/login`、`/api/users/:id`）、HTTP 方法表达动作、响应统一 `{ code, message, data }`；需鉴权接口校验 `Authorization` 头（如 `/api/user/profile`）
- **登录接口**：`POST /api/auth/login` 校验账号密码；admin 为系统管理员（独立账号），其余账号走 `users` 数据池（user01/user08/user15/user22/user29 为管理员角色）；失败返回业务码 `1001`（HTTP 200，不触发 401 清理逻辑）
- **业务零改动**：切换开关或环境后重启 dev 即生效；接口 url 写资源路径（不带 `/api`，baseURL 自动补全），与 handler 完整路径对齐

```ts
// 示例：用户域接口（src/api/modules/user.ts 预留位）
const user = await request<UserInfo>({ url: '/users/1', method: 'get' }) // 实际 /api/users/1
```

## 路径别名

`@` 指向 `src`，已同步配置 `vite.config.ts`（运行时）与 `tsconfig.app.json`（类型提示）：

```ts
import { router } from '@/router'
```

## 环境变量

以 `VITE_` 前缀命名的变量会被注入 `import.meta.env`，新增变量后在 `src/env.d.ts` 补充类型。

## ESLint（代码规范）

配置文件 `eslint.config.js`（Flat Config），规则组成：

- TypeScript 推荐规则（未使用变量等；`_` 前缀参数/变量豁免）
- React Hooks 官方规则：违反 rules-of-hooks 报错；`exhaustive-deps` 与 `set-state-in-effect` 为警告（挂载拉取数据、路由→state 同步是 effect 的正当用途，属已知误报）
- Fast Refresh 组件导出约束（`src/main.tsx` 入口豁免）
- **分层边界强制**：`src/pages`、`src/components` 下禁止直接 import `axios` 与 `@/mocks/*`，数据必须走 `src/api`（违反即 lint error）

> **TS7 / TS6 双别名说明**：TypeScript 7 不提供 JS API，typescript-eslint 目前只能运行在 TS 6 API 上（官方跟踪 issue #10940）。项目采用 TS 官方过渡方案：`typescript` 依赖实际指向 `@typescript/typescript6`（仅供 ESLint 解析），真正的 TS7 通过别名依赖 `@typescript/native` 安装并提供 `tsc` 二进制。因此 `npm run lint` 用 TS6 解析器、`npm run type-check` / `build` 用 TS7；**类型正确性以 type-check 为准**。待 typescript-eslint 原生支持 TS7 后可移除双别名，恢复单个 `typescript` 依赖。
