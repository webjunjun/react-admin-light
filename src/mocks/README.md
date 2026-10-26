# Mock（MSW）

基于 MSW（Service Worker）的浏览器端接口 Mock，生产级结构。

## 目录

```
src/mocks/
├── browser.ts          # setupWorker 初始化（main.tsx 按开关动态启用）
├── handlers/           # 接口 handlers（按业务域分文件）
│   ├── index.ts        # 聚合所有 handlers
│   └── user.ts         # 用户域示例（REST 规范）
├── data/               # mock 数据模板（与后端响应结构对齐）
│   └── user.ts
└── README.md
```

## 开关

- 环境变量 `VITE_USE_MOCK` 控制是否启用：`true` 开启，其余值关闭
- `.env.development` 默认 `true`（开发自动开启）
- `.env.production` 默认 `false`（生产自动关闭，构建时按条件剔除 mock 代码）
- 业务代码零改动：切换开关/环境后重启 dev 即生效

## 规范

- 接口 URL 遵循 REST：资源复数路径 `/api/users`、`/api/users/:id`，动作用 HTTP 方法表达
- 响应统一为前端 `ApiResponse` 结构：`{ code, message, data }`
- 新增业务域：`handlers/<domain>.ts` + `data/<domain>.ts`，并在 `handlers/index.ts` 聚合
- 需要鉴权的接口在 handler 内校验 `Authorization` 头（如 `/api/user/profile`）
