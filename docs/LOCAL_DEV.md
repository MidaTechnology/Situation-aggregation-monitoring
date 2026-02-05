# Situation Monitor — 本地开发与修改指南

## 一、环境准备

### 1. Node.js

- **推荐**：Node.js 18+ 或 20 LTS（项目使用 Vite 6、SvelteKit 2）
- 检查版本：`node -v`、`npm -v`

### 2. 克隆与依赖

```bash
cd /path/to/situation-monitor
npm install
```

---

## 二、环境变量（可选）

项目可在**无任何 API Key** 下运行，部分功能会降级或提示配置。

| 变量                   | 用途                | 获取方式                                                           | 必填                        |
| ---------------------- | ------------------- | ------------------------------------------------------------------ | --------------------------- |
| `VITE_FINNHUB_API_KEY` | 股指/板块等市场数据 | [finnhub.io](https://finnhub.io/) 免费注册                         | 否（无则市场相关受限）      |
| `VITE_FRED_API_KEY`    | 美联储经济指标      | [FRED API](https://fred.stlouisfed.org/docs/api/api_key.html) 免费 | 否（无则 Fed 面板提示配置） |

**本地配置步骤：**

1. 复制示例文件：
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env`，填入你的 Key（不要提交到 Git）：
   ```env
   VITE_FINNHUB_API_KEY=你的finnhub_key
   VITE_FRED_API_KEY=你的fred_key
   ```

**说明**：RSS 新闻通过代码里配置的 CORS 代理访问，无需额外 Key；加密货币用 CoinGecko 公开接口，也无需 Key。

---

## 三、本地运行

### 开发模式（热更新，推荐日常修改）

```bash
npm run dev
```

- 默认：**http://localhost:5173**
- 修改 Svelte/TS/CSS 会热更新，无需手动刷新

### 本地不设置 BASE_PATH

- 生产部署到 GitHub Pages 时使用 `BASE_PATH=/situation-monitor`。
- **本地开发不要设** `BASE_PATH`，否则资源路径会错，直接 `npm run dev` 即可。

### 生产构建 + 本地预览

```bash
npm run build
npm run preview
```

- 预览地址一般为 **http://localhost:4173**，用于检查静态构建效果和跑 E2E。

---

## 四、修改项目时的建议

### 1. 按规范开分支

- 新功能/修复先开分支再改：`git checkout -b feature/xxx` 或 `fix/xxx`
- 改完再合并到 `main`，便于回滚和 Code Review

### 2. 改什么、改哪里

| 想改的内容                     | 建议修改位置                                         |
| ------------------------------ | ---------------------------------------------------- |
| 新闻源、分类                   | `src/lib/config/feeds.ts`                            |
| 告警词、地区/主题关键词        | `src/lib/config/keywords.ts`                         |
| 相关性主题、叙事规则、来源类型 | `src/lib/config/analysis.ts`                         |
| 面板列表、名称、优先级         | `src/lib/config/panels.ts`                           |
| 地图热点、冲突区               | `src/lib/config/map.ts`                              |
| 市场/API 基础配置              | `src/lib/config/api.ts`、`src/lib/config/markets.ts` |
| 新闻/市场/其他数据拉取逻辑     | `src/lib/api/*.ts`                                   |
| 分析逻辑（相关/叙事/主角）     | `src/lib/analysis/*.ts`                              |
| 缓存、熔断、请求封装           | `src/lib/services/*.ts`                              |
| 页面布局、展示哪些面板         | `src/routes/+page.svelte`                            |
| 单个面板 UI/交互               | `src/lib/components/panels/*.svelte`                 |
| 全局状态、刷新策略             | `src/lib/stores/*.ts`                                |

### 3. 改完后的自检

```bash
npm run check      # TypeScript 类型检查
npm run lint       # ESLint + Prettier 检查
npm run format     # 自动格式化（建议改完跑一次）
npm run test:unit  # 单元测试
# 若改动了页面/流程，再跑 E2E（需先 npm run preview）：
npm run test:e2e
```

### 4. 提交前

- 运行上述 `check`、`lint`、`test:unit`，保证通过
- 按项目要求，PR 前可跑一遍 code-simplifier 等整理代码

---

## 五、常见问题

### 1. 新闻/外链请求失败（CORS、超时）

- 项目使用 CORS 代理：先试 `situation-monitor-proxy.seanthielen-e.workers.dev`，失败会回退到 `corsproxy.io`。
- 若两个都不可用，可在 `src/lib/config/api.ts` 的 `CORS_PROXIES` 里换成你自己的代理 URL（例如自建 Cloudflare Worker）。

### 2. 市场/Fed 面板无数据或提示 “Add API Key”

- 配置 `.env` 中的 `VITE_FINNHUB_API_KEY` 和/或 `VITE_FRED_API_KEY`。
- 修改 `.env` 后需**重启** `npm run dev`，Vite 才会把新环境变量打进前端。

### 3. 本地路径 404（例如刷新后 404）

- 本地不要设置 `BASE_PATH`。
- 若你改了 `svelte.config.js` 的 `paths.base`，本地开发时保持为空字符串。

### 4. 依赖安装报错

- 删除锁文件与依赖后重装：`rm -rf node_modules package-lock.json && npm install`
- 确认 Node 版本 ≥ 18

### 5. E2E 失败

- 先启动预览：`npm run build && npm run preview`
- 再在另一个终端：`npm run test:e2e`
- 首次运行可能需要：`npx playwright install` 安装浏览器

---

## 六、常用命令速查

| 命令                  | 说明                                 |
| --------------------- | ------------------------------------ |
| `npm run dev`         | 开发服务器（localhost:5173），热更新 |
| `npm run build`       | 生产构建到 `build/`                  |
| `npm run preview`     | 预览生产构建（localhost:4173）       |
| `npm run check`       | TypeScript 检查                      |
| `npm run check:watch` | 监听模式类型检查                     |
| `npm run lint`        | 代码与格式检查                       |
| `npm run format`      | Prettier 自动格式化                  |
| `npm run test`        | Vitest 监听模式                      |
| `npm run test:unit`   | 单元测试跑一次                       |
| `npm run test:e2e`    | Playwright E2E（需先 preview）       |

---

按上述步骤即可在本地顺利运行并修改项目；遇到具体报错或某一块想深入（例如只改分析引擎或只改某个面板），可以再针对那部分细化。
