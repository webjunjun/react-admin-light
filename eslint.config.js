// ESLint 9+ Flat Config
// TypeScript 7 不提供 JS API，typescript-eslint@8.x 只能运行在 TS 6 API 上。
// 采用 TS 官方双别名方案（见 package.json devDependencies）：
//   typescript        -> @typescript/typescript6（TS 6 API，仅供 eslint 解析）
//   @typescript/native -> typescript@7（真正的 TS7，提供 tsc 二进制）
// 故 npm run lint 走 TS6 解析器，npm run type-check / build 走 TS7 tsc；
// 类型正确性以 type-check 为权威。
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // 不参与 lint：构建产物、第三方产物（MSW 生成的 Service Worker）
  { ignores: ['dist', 'coverage', 'public'] },

  // JS 推荐规则
  js.configs.recommended,

  // TS/TSX 推荐规则（非类型感知；类型问题交给 tsc）
  ...tseslint.configs.recommended,

  // 业务源码：浏览器环境 + 未使用变量豁免下划线前缀
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // React Hooks 官方推荐规则（rules-of-hooks 报错 / exhaustive-deps 警告）
  reactHooks.configs.flat.recommended,
  {
    rules: {
      // 挂载拉取数据、把外部系统（路由）同步进 state 都是 effect 的正当用途，
      // 此规则会误报这些模式，降为警告：保留提示但不阻断
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // Fast Refresh：组件文件只导出组件（允许同时导出常量）
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // 应用入口不参与组件级 HMR，无需满足 Fast Refresh 导出约束
  {
    files: ['src/main.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // 分层边界（对应 AGENTS.md 架构铁律 1）：
  // 页面与通用组件禁止直接使用 axios、禁止直接引用 mocks —— 数据一律走 src/api
  {
    files: ['src/pages/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['axios', 'axios/*'],
              message: '页面/组件禁止直接使用 axios，统一走 src/api/request.ts',
            },
            {
              group: ['@/mocks', '@/mocks/*'],
              message: '页面/组件禁止直接引用 mock，数据一律通过 src/api/modules',
            },
          ],
        },
      ],
    },
  },

  // Node 环境文件
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
)
