# 配置项说明 — 在哪改、改什么

所有可配置项都在 **`src/lib/config/`** 目录下，按功能分文件。

---

## 速查表

| 想改的内容                       | 配置文件           | 说明                                                 |
| -------------------------------- | ------------------ | ---------------------------------------------------- |
| 新闻源（RSS）                    | `feeds.ts`         | 各分类下的 `name`、`url`，可增删改                   |
| 告警词、地区/主题关键词          | `keywords.ts`      | 标题匹配后标红、打地区/主题标签                      |
| 面板名称、优先级                 | `panels.ts`        | 侧边栏/设置里显示的名字、排序权重                    |
| 首次访问的预设                   | `presets.ts`       | 引导页里选的「News Junkie / Trader / Geopolitics」等 |
| 市场：股指、板块、大宗、加密货币 | `markets.ts`       | 符号、显示名                                         |
| API Key、CORS 代理               | `api.ts`           | 环境变量在这里被读取；代理 URL 可改                  |
| 相关性/叙事分析规则              | `analysis.ts`      | 正则主题、叙事关键词、来源分类                       |
| 地图热点、冲突区等               | `map.ts`           | 热点、冲突区、海峡、海底电缆等                       |
| 世界领导人列表                   | `leaders.ts`       | 领导人 id、名字、国家、关键词等                      |
| **中/英文界面**                  | `locale.ts` + 设置 | 面板名、预设、按钮等；设置里可切换「中文 / English」 |

---

## 1. 环境变量（不写在 config 里）

- 位置：项目根目录 **`.env`**（复制 `.env.example` 后编辑）
- 当前用到的变量：
  - `VITE_FINNHUB_API_KEY` — 市场数据（股指、板块等），见 `api.ts`
  - `VITE_FRED_API_KEY` — 美联储经济指标，见 `api.ts`
- 改完 `.env` 后需**重启** `npm run dev` 才会生效。

---

## 2. `feeds.ts` — 新闻源

- **FEEDS**：按分类（politics / tech / finance / gov / ai / intel）配置 RSS，每项 `{ name, url }`。
- **INTEL_SOURCES**：情报类源，多出 `type`、`topics`、`region`。
- 增删改某一条：直接改对应数组里的对象即可。

---

## 3. `keywords.ts` — 关键词

- **ALERT_KEYWORDS**：标题命中会标为「告警」并高亮。
- **REGION_KEYWORDS**：地区标签（EUROPE / MENA / APAC 等）。
- **TOPIC_KEYWORDS**：主题标签（CYBER / NUCLEAR / CONFLICT 等）。
- 工具函数：`containsAlertKeyword`、`detectRegion`、`detectTopics` 会用到这些配置。

---

## 4. `panels.ts` — 面板

- **PanelId**：所有面板 ID 的联合类型，新增面板需先在这里加 ID。
- **PANELS**：`Record<PanelId, { name, priority }>`，`name` 是界面显示名，`priority` 影响排序（1/2/3）。
- **NON_DRAGGABLE_PANELS**：不可拖拽的面板（如地图）。
- **MAP*ZOOM*\***：地图缩放范围与步进。

---

## 5. `presets.ts` — 首次访问预设

- **PRESETS**：每个预设的 `id`、`name`、`icon`、`description`、`panels`（要开启的 PanelId 数组）。
- **PRESET_ORDER**：引导页里预设的显示顺序。
- 修改某预设下显示哪些面板：改对应 preset 的 `panels` 数组。

---

## 6. `markets.ts` — 市场

- **SECTORS**：板块 ETF（如 XLK、XLF），用于热力图等。
- **COMMODITIES**：大宗（VIX、黄金、原油等），`symbol` 需和 Yahoo 等数据源一致。
- **INDICES**：股指（道指、标普、纳斯达克等）。
- **CRYPTO**：加密货币，`id` 对应 CoinGecko 的 id。

---

## 7. `api.ts` — API 与请求

- **FINNHUB\_\*** / **FRED\_\***：从环境变量读取 Key，见上文。
- **CORS_PROXIES**：RSS 等跨域请求用的代理，`primary` 失败会用 `fallback`；可改成自己的代理 URL。
- **API_DELAYS**、**CACHE_TTLS**：请求间隔、缓存 TTL。
- **DEBUG**、**logger**：开发时是否打 API 日志。

---

## 8. `analysis.ts` — 分析规则

- **CORRELATION_TOPICS**：相关性主题，每条有 `id`、`patterns`（正则数组）、`category`。
- **NARRATIVE_PATTERNS**：叙事追踪，`keywords`、`category`、`severity`（watch / emerging / spreading / disinfo）。
- **SOURCE_TYPES**：来源分类（fringe / alternative / mainstream），用于叙事「从边缘到主流」判断。
- **PERSON_PATTERNS**：人物识别正则，用于「主角」分析。

---

## 9. `map.ts` — 地图

- **HOTSPOTS**、**CONFLICT_ZONES**、**CHOKEPOINTS**、**CABLE_LANDINGS**、**NUCLEAR_SITES**、**MILITARY_BASES** 等：地理图层数据，格式见类型定义。
- **THREAT_COLORS**、**WEATHER_CODES** 等：样式与编码。

---

## 10. `leaders.ts` — 世界领导人

- **WORLD_LEADERS**：领导人列表，含 id、姓名、职位、国家、关键词、任期等，用于「世界领导人」面板与新闻关联。

---

## 修改后如何生效

- 只改 **config 下的 .ts 文件**：保存后 Vite 会热更新，刷新页面即可。
- 改了 **`.env`**：需要重启 `npm run dev`。
- 新增了 **PanelId 或面板**：除了改 `panels.ts`，还要在 `src/routes/+page.svelte` 里加对应 `{#if isPanelVisible('新id')}` 和组件，否则设置里能选但页面上不会渲染。
