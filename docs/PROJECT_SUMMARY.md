# Situation Monitor 项目总结

## 一、总述

**Situation Monitor** 是一款实时全球态势监控仪表盘：聚合多源新闻、市场数据、地缘热点与链上/政策信息，通过可配置面板与 AI 分析，提供一站式情报与市场视图。采用 **SvelteKit 2 + Svelte 5 + TypeScript** 构建，支持静态部署（GitHub Pages / Vercel），无后端依赖即可运行；配置 API Key 后可接入真实行情与 AI 总结。

---

## 二、分述

### 2.1 功能模块

| 类别 | 面板/能力 | 说明 |
|------|-----------|------|
| **态势** | 全球地图、新闻（国际/科技/财经/政府/AI/情报） | 地图固定顶部全宽；新闻按分类 RSS + GDELT 等聚合 |
| **市场** | 市场、板块热力图、大宗/VIX、加密货币 | 指数/个股（Twelve Data 搜索）、热力图、大宗、Crypto（CoinGecko 等） |
| **监控** | 我的监控 | 自定义监控项与规则，支持表单配置 |
| **政策与事件** | 美联储、世界领导人、政府合同、裁员追踪、Polymarket | FRED 指标、领导人动态、合同与裁员数据、预测市场 |
| **链上与快讯** | 巨鲸动向、BlockBeats 快讯 | 链上地址监控、行业快讯 |
| **分析** | 主角分析、相关性引擎、叙事追踪、AI 分析 | 基于新闻的实体/相关性/叙事分析；AI 总结（可配 DeepSeek 等） |
| **地区** | 委内瑞拉/格陵兰/伊朗局势 | 按地区聚合的局势面板 |

面板显示顺序与开关持久化在本地（localStorage），支持拖拽排序（地图不参与拖拽、始终置顶）。

### 2.2 技术架构

- **前端框架**：SvelteKit 2、Svelte 5（`$state` / `$derived` / `$effect`），TypeScript 严格模式，Tailwind + 深色主题。
- **目录职责**：
  - `src/lib/analysis/`：相关性、叙事、主角等分析逻辑，依赖 `config/analysis.ts` 等配置。
  - `src/lib/api/`：各类数据拉取（新闻、市场、CoinGecko、Twelve Data、Polymarket、鲸鱼、BlockBeats 等）。
  - `src/lib/components/`：布局（Header、Dashboard）、面板（panels）、弹窗（modals）、通用组件（common）。
  - `src/lib/config/`：feeds、keywords、panels、map 热点、AI 等集中配置。
  - `src/lib/services/`：缓存、熔断、请求去重与统一 HTTP 客户端（ServiceClient）。
  - `src/lib/stores/`：设置、新闻、市场、监控、刷新编排等状态。
- **数据流**：多阶段刷新（关键 → 次要 → 第三批）错峰请求；面板按 `settings.order` 与 `enabled` 决定展示与顺序；地图单独全宽置顶，其余面板 masonry 分栏。

### 2.3 数据与 API

#### 2.3.1 数据源（按类别）

| 类别 | 数据源 / API | 用途 | 环境变量 / 说明 |
|------|--------------|------|-----------------|
| **新闻 / RSS** | 多路 RSS（`config/feeds.ts`） | 国际、科技、财经、政府、AI、情报分类新闻 | 经 CORS 代理（`corsproxy.io` 等）拉取，无需 Key |
| | politics：BBC、NPR、Guardian、NYT 等 | 国际/地缘面板 | `FEEDS.politics` |
| | tech：Hacker News、Ars、Verge、MIT TR、ArXiv AI、OpenAI 等 | 科技/AI 面板 | `FEEDS.tech` |
| | finance：CNBC、MarketWatch、Yahoo、BBC Business、FT | 财经面板 | `FEEDS.finance` |
| | gov：White House、Federal Reserve、SEC、DoD | 政府/政策面板 | `FEEDS.gov` |
| | intel：CSIS、Brookings、CFR、Defense One、Bellingcat、CISA 等 | 情报源面板 | `INTEL_SOURCES` |
| **新闻 / 其他** | GDELT、美联储 RSS 等 | 新闻聚合、美联储面板新闻区 | 见 `api/news.ts`、`api/fred.ts` |
| **财联社电报** | 财联社 telegraph 页 | 财联社电报面板（若启用） | 服务端代理 `/api/cls`，抓取 `cls.cn/telegraph`，无 Key |
| **市场 / 股票** | Finnhub Quote | 指数（道琼斯/标普/纳指/Russell 用 ETF 代理）、板块热力图、大宗/VIX | `VITE_FINNHUB_API_KEY`，60 次/分 |
| | Twelve Data symbol_search | 市场/大宗面板「添加更多」中搜索股票/指数 | `VITE_TWELVE_DATA_API_KEY`，代理 `/api/twelve-data/symbol-search` |
| **市场 / 加密货币** | CoinGecko simple/price | 加密货币价格（主） | 代理 `/api/coingecko/simple-price`，服务端缓存，无 Key 可限流 |
| | CoinMarketCap quotes | 加密货币价格（备用，Gecko 429 时） | `COINMARKETCAP_API_KEY` 或 `VITE_*`，代理 `/api/coinmarketcap/quotes` |
| **美联储** | FRED API | 联邦基金利率、CPI、10Y 国债等经济指标 | `VITE_FRED_API_KEY`，免费无限次 |
| | 美联储 RSS + 官网 | 美联储新闻、演讲/视频列表 | 见 `api/fred.ts` |
| **裁员** | Intellizence Layoff Dataset | 近期/实时裁员（可选） | `VITE_INTELLIZENCE_API_KEY` |
| | Airtable（layoffs.fyi 同源） | 科技裁员表（可选） | `VITE_AIRTABLE_LAYOFFS_API_KEY` |
| | GitHub CSV（omswa513/Layoffs） | 历史裁员数据（无上述 Key 时） | 无需 Key |
| **链上 / 巨鲸** | Etherscan API | 0x 地址交易与余额（ETH 链） | `VITE_ETHERSCAN_API_KEY`，代理 `/api/etherscan` |
| | Solana RPC | SOL 链地址交易（只读） | 代理 `/api/solana-rpc`，公共 RPC |
| | Whale Alert 等 | 巨鲸告警/监控（若集成） | 见 `api/whaleAlert.ts`、`api/misc.ts` |
| **其他** | Polymarket | 预测市场盘口 | `api/polymarket.ts`，CORS 代理，无 Key |
| | BlockBeats | 快讯列表 | `api/blockbeats.ts`，无 Key |
| | 世界领导人 | 领导人动态 | `api/leaders.ts`，依赖新闻/配置 |
| | 政府合同（USAspending 等） | 政府合同面板 | `api/misc.ts`，CORS 代理 |
| **AI** | DeepSeek 等 | AI 分析面板「生成总结」 | `VITE_AI_API_KEY`，代理 `/api/ai-summary` |

#### 2.3.2 模块与数据对应（面板 → Store → API/数据源）

| 面板（PanelId） | 使用的 Store | 主要 API / 数据源 | 备注 |
|-----------------|--------------|-------------------|------|
| map | 无独立 store，用 monitors + config | `config/map.ts` 热点、D3+TopoJSON、监控匹配 | 全宽置顶，不拖拽 |
| politics / tech / finance / gov / ai | news（按分类） | `api/news.ts` → RSS（FEEDS）+ CORS 代理 | 多阶段刷新 |
| intel | news（intel 分类） | `api/news.ts` → INTEL_SOURCES RSS | 情报源面板 |
| cls（财联社电报） | clsTelegraph | `api/cls.ts` → `/api/cls` 服务端抓取 | 若在 panels 中启用 |
| markets | indices, indicesList | `api/markets.ts` → Finnhub Quote（ETF 代理指数）；Twelve Data 搜索走 `/api/twelve-data/symbol-search` | 见 `docs/MARKETS_DATA_SOURCES.md` |
| heatmap | sectors | `api/markets.ts` → Finnhub 板块 ETF | 与 markets 同次拉取 |
| commodities | commodities, commodityList | `api/markets.ts` → Finnhub（VIX/大宗代码） | 与 markets 同次拉取 |
| crypto | crypto, cryptoList | `api/markets.ts` → CoinGecko/CoinMarketCap 代理 | 与 markets 同次拉取，有缓存与降级 |
| fed | fedNews, fedIndicators, fedVideos | `api/fred.ts`（FRED + 美联储 RSS/官网） | 需 `VITE_FRED_API_KEY` 显示指标 |
| polymarket | 页面级传入 predictions | `api/polymarket.ts` | 第三阶段刷新 |
| whales | whaleAddresses + 链上拉取 | `api/misc.ts` + Etherscan/Solana 代理 | 需 `VITE_ETHERSCAN_API_KEY` 显示真实链上 |
| blockbeats | blockbeats | `api/blockbeats.ts` | 快讯列表 |
| leaders | 页面级 / leaders API | `api/leaders.ts` + 配置 | 世界领导人 |
| contracts | 页面级 | `api/misc.ts` fetchGovContracts | 政府合同 |
| layoffs | 页面级 | `api/misc.ts` fetchLayoffs（Intellizence/Airtable/CSV） | 裁员追踪 |
| printer | 页面级 | FRED 等（印钞机相关） | 见对应面板 |
| monitors | monitors | 本地 store，匹配新闻/Polymarket 等 | 我的监控 |
| mainchar / correlation / narrative | 分析结果 | `lib/analysis/` + 新闻数据 | 主角分析、相关性、叙事追踪 |
| aiInsights | aiSettings | `api/ai.ts` → `/api/ai-summary` | 需 `VITE_AI_API_KEY` |
| venezuela / greenland / iran | SituationPanel | 新闻 + 地区关键词（config） | 局势面板 |

环境变量汇总（见 `.env.example`）：`VITE_FINNHUB_API_KEY`、`VITE_TWELVE_DATA_API_KEY`、`VITE_FRED_API_KEY`、`VITE_ETHERSCAN_API_KEY`、`VITE_INTELLIZENCE_API_KEY`、`VITE_AI_API_KEY`；可选 `VITE_AIRTABLE_LAYOFFS_API_KEY`、`COINMARKETCAP_API_KEY` 等。未配置时对应面板可降级或占位。

### 2.4 配置、构建与部署

- **配置**：面板列表与默认顺序在 `src/lib/config/panels.ts`；新闻源、关键词、分析规则等在 `config/` 下按功能拆分。
- **构建**：`npm run build`（静态适配器，输出到 `build/`）；`npm run preview` 本地预览。
- **部署**：GitHub Actions 可部署到 GitHub Pages（如 `BASE_PATH=/situation-monitor`）；亦支持 Vercel（`vercel.json`）。生产环境需在托管平台配置 `VITE_*` 环境变量并重新构建。
- **质量**：`npm run check` 类型检查；`npm run test` / `npm run test:unit`（Vitest）；`npm run test:e2e`（Playwright）。

---

## 三、总结

Situation Monitor 以**配置驱动 + 服务层容错 + 多阶段刷新**的方式，把新闻、市场、地图、监控与 AI 分析统一到单页仪表盘中；地图固定顶部，其余面板可排序、可开关，适配桌面与移动端。通过可选 API Key 与服务端代理，在静态部署下兼顾扩展性与 CORS 限制，适合作为内外部态势与市场监控的入口。更多实现细节见 `CLAUDE.md`、`docs/` 下各专题文档及 `.env.example`。
