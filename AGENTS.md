# AGENTS.md — AI 协作约定（本仓库硬约束）

面向在本仓库工作的 AI 编码助手。**先读本文件，再动手。**
完整背景与用法见 `README.md`；二者冲突时以本文件为准。

## 项目一句话

React 19 + Vite + TS + antd6 的企业后台：路由守卫 + 动态菜单 + 多标签页缓存（keepalive-for-react）+ zustand + axios + MSW（当前接口全部为 mock，`VITE_USE_MOCK=true`）。

## 常用命令

- `npm run dev` 开发；`npm run type-check` 类型检查（TS7 权威）；`npm run lint` / `npm run lint:fix` ESLint；`npm run build` 构建
- 本项目**禁止引入 StrictMode**（keepalive-for-react 要求）
- 演示账号：admin / user02，密码统一 `123456`
- **TS 双别名（勿改）**：TS7 不提供 JS API，package.json 中 `typescript` 指向 `@typescript/typescript6`（仅供 ESLint 解析），`@typescript/native` 才是真正的 TS7（提供 `tsc`）。这是官方过渡方案，不要"修复"成单个 typescript 依赖

## 架构铁律（不可违反）

1. **依赖方向只能单向**：`pages → api/modules + stores + types`；`api/modules → request.ts`。
   页面/组件**禁止**直接 new axios、直接 import mocks、跨业务域引用其他页面的内部组件。
   （前两条由 `eslint.config.js` 的 `no-restricted-imports` 强制，lint 会直接报错）
2. **菜单唯一数据源是 `src/router/menu.tsx`**（key = 路由 path，roles 白名单控可见性）；
   路由表在 `src/router/index.tsx`。两者必须同步，禁止只改一处。
3. **类型单一数据源在 `src/types/<域>.ts`**，api 层、mock 层、页面共用，禁止各处各写一份 interface。
4. **接口按域放 `src/api/modules/`**；mock handler 放 `src/mocks/handlers/`，mock 数据放 `src/mocks/data/`。
   mock 的数据结构必须与（未来的）真实后端契约一致。
5. **样式用 CSS Module**（`*.module.css`），antd 组件为主，不引入第二套 UI 库/样式方案。
6. **共享代码克制提取**：`components/`、`hooks/`、`utils/` 只在出现第 3 处真实重复时才提取；
   不为 DRY 而 DRY，不在列结构未变时提前重构。

## 新增一个业务页面（完整清单，缺一不可）

1. `src/pages/<域>/<name>/`：`index.tsx`（容器，默认导出）+ 需要时拆 `XxxTable.tsx` / `XxxFormModal.tsx`
   —— 以 `src/pages/system/users/` 为标准范本（容器/表格/弹窗三层）
2. `src/types/<域>.ts`：Record / Query / PageResult / 各 Payload
3. `src/api/modules/<域>.ts`：接口函数（走 `request`，REST 规范）
4. `src/mocks/handlers/<域>.ts` + 在 `handlers/index.ts` 注册；`src/mocks/data/<域>.ts` 放内存数据
5. `src/router/index.tsx`：在 AdminLayout children 注册路由（lazy import）；受限页面套 `RequirePermission`（权限点 = 路由 path）
6. `src/router/menu.tsx`：加菜单项（key 与 path 完全一致，作为该菜单的权限点 id）
7. 涉及多标签页缓存的页面，列表刷新用 `useActivated`（见 `src/hooks/useKeepAliveLifecycle.ts`）

## 当前信息架构（改完必须同步更新此表）

| 路由 | 页面 | 所需权限 | 固定页签 |
| --- | --- | --- | --- |
| `/`、`/dashboard` | 工作台 | `/`（全部登录用户） | 是（不可关闭） |
| `/system/users` | 用户管理 | `/system/users` | 否 |
| `/system/roles` | 角色管理 | `/system/roles` | 否 |
| `/system/menus` | 菜单管理（只读） | `/system/menus` | 否 |
| `/system/settings` | 系统设置 | `/system/settings`（全部登录用户） | 否 |
| `/login` | 登录（GuestOnly） | 游客 | — |
| `/403`、`/404`、`*` | 结果页（不登记页签） | — | — |

## 改动前必须经用户确认的文件（横切基础设施）

- `src/api/request.ts`（拦截器/错误处理/下载）
- `src/layouts/AdminLayout/*`（布局、多标签页、缓存同步逻辑）
- `src/stores/tabs.ts`、`src/stores/user.ts`
- `src/router/guards.tsx`、`src/main.tsx`、`eslint.config.js`、依赖版本（package.json）

## 变更协议

- **最小改动**：只改需求涉及的代码，禁止顺手重构、重命名、格式化无关文件
- 预估跨 3 个及以上文件、或触碰上表基础设施时：**先给方案和影响面清单，确认后再写代码**
- 一个任务只做一件事；发现无关问题只记录、不顺手修
- 不主动新建文档文件；不提交 git，除非用户明确要求
- 中文注释，风格与相邻文件保持一致

## 完成后自检

1. `npm run lint` 与 `npm run type-check` 必须通过（lint 允许保留已说明原因的 warn，不允许新增 error）
2. 人工冒烟（浏览器实际操作并描述结果）：登录 → 开 3 个页签 → 切换/×关闭/右键关闭其他 →
   受影响业务页面主流程（列表查询/新增/编辑/删除）→ 登出
3. 检查无 console 报错；如改动了 IA，同步更新本文件表格与 README
