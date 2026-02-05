# 大宗模块与市场（指数）接口套用分析

## 1. 市场（指数）模块现状

| 能力 | 实现 |
|------|------|
| **数据源** | Finnhub 报价 + 东财 Push2（A 股 fallback） |
| **预设列表** | `INDICE_OPTIONS`（指数 + 常见 ETF/股票） |
| **搜索** | Twelve Data `symbol_search`（`searchSymbols`），可搜股票/ETF |
| **列表 store** | `indicesList`：`addIndex({ symbol, name })`，**不限制 symbol**，任意标的都可加 |
| **取价逻辑** | `fetchIndices`：A 股用东财，其余用 Finnhub（含 INDEX_ETF_MAP 映射） |
| **弹窗 UI** | 预设区 + 搜索区；搜索结果每行右侧 **+**（未添加）/ **×**（已添加），不关弹窗 |

## 2. 大宗模块现状

| 能力 | 实现 |
|------|------|
| **数据源** | 仅 Finnhub，通过 `COMMODITY_SYMBOL_MAP` 把期货代码映射成 ETF（如 GC=F→GLD） |
| **预设列表** | `COMMODITY_OPTIONS`（固定 12 个：^VIX, GC=F, CL=F, …） |
| **搜索** | **无远程搜索**，仅本地对 `COMMODITY_OPTIONS` 按关键词 filter |
| **列表 store** | `commodityList`：`addCommodity(symbol)` **只允许** `symbolSet.has(symbol)`，即只能加预设 12 个 |
| **取价逻辑** | `fetchCommodities`：只处理列表里的 symbol，用 `COMMODITY_SYMBOL_MAP[symbol] || symbol` 向 Finnhub 要价 |
| **弹窗 UI** | 仅预设列表；添加后关弹窗并清空搜索 |

## 3. 能否套用“这套接口”

**结论：可以套用，需改三块。**

### 3.1 搜索接口（Twelve Data）

- **可直接复用** `searchSymbols`（`$lib/api/twelveData.ts`）。
- Twelve Data 支持股票/ETF，搜 "gold"、"GLD"、"USO"、"oil"、"VIXY" 等会返回对应标的，与指数模块用同一套 API 即可。
- 大宗**不需要**东财接口（当前无 A 股大宗需求，且 Finnhub 已用 ETF 映射）。

### 3.2 列表 Store（commodityList）

- **现状**：`addCommodity(symbol)` 仅在 `symbolSet.has(symbol)` 时为 true，即只接受 `COMMODITY_OPTIONS` 里的 symbol。
- **要套用**：需支持“搜索得到的任意 symbol”，有两种方式：
  1. **放宽为任意 symbol**：类似 indicesList，提供 `addCommodity({ symbol, name })`，不校验是否在预设里；持久化时允许任意 symbol。
  2. **扩展允许集合**：保持“仅允许预设 + 搜索到的 ETF 列表”，即把 Twelve Data 返回的 symbol 也视为合法（实现上要么动态允许，要么仍放宽为任意）。
- **推荐**：采用与指数一致的 **任意 symbol** 方案，逻辑简单，且 Finnhub 对常见 ETF 都能报价。

### 3.3 取价逻辑（fetchCommodities）

- **现状**：列表中的 symbol 必须落在 `COMMODITY_SYMBOL_MAP` 或直接用 symbol；列表本身来自预设，所以始终在映射表或预设内。
- **套用后**：用户可能添加“搜索到的 ETF”（如 GLD、USO、VIXY），这些可能不在 `COMMODITY_SYMBOL_MAP`（当前映射是期货代码→ETF）。
- **改法**：  
  - 对已在 `COMMODITY_SYMBOL_MAP` 的 symbol（如 `GC=F`），继续用映射后的 symbol 请求 Finnhub。  
  - 对不在映射表中的 symbol（如用户搜到的 GLD、USO），**直接用该 symbol** 调 Finnhub quote；无需新增接口，仅逻辑分支即可。

### 3.4 UI 行为

- **可完全套用**：
  - 弹窗内：**预设区** + **搜索区**（占位符可用现有 `commodityPicker.searchPlaceholder`）。
  - 搜索结果列表：每行右侧 **+**（未添加）/ **×**（已添加），颜色区分（如 accent / danger）。
  - 已添加的标的不从搜索结果里过滤掉，再次搜索仍显示，且显示为已添加（×）。
- 若需与指数模块完全一致，可再统一：不因添加而关弹窗、不清空搜索框。

## 4. 实现要点小结

| 项目 | 操作 |
|------|------|
| **Twelve Data** | 大宗弹窗内复用 `searchSymbols`，与指数模块同一套接口。 |
| **commodityList** | 支持“任意 symbol”（如 `addCommodity({ symbol, name })` 或放宽 `addCommodity(symbol)` 的校验），持久化、`getSelectedConfig` 返回 name 用于展示。 |
| **fetchCommodities** | 对 `COMMODITY_SYMBOL_MAP` 中有的用映射 symbol 请求 Finnhub；对没有的用原 symbol 直接请求 Finnhub。 |
| **CommoditiesPanel** | 增加“搜索区 + 搜索结果列表”，结果行用 +/× 表示未添加/已添加，不关弹窗、不清空搜索（与当前指数模块一致）。 |

按上述改完后，大宗模块即可套用“预设 + Twelve Data 搜索 + +/× 状态”这一套接口与交互。
