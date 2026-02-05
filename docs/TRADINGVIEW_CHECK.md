# TradingView 作为股指数据源的可行性检查

## 结论：**不能**可靠地通过 TradingView 获取股指报价用于本项目

TradingView **没有**面向公众的免费、可直接调用的 Quote/价格 API。现有能力要么需要自建数据源，要么仅供合作方/付费使用，或存在访问限制。

---

## 1. 官方/半官方能力

| 能力 | 说明 | 是否适合本项目 |
|------|------|----------------|
| **Charting Library** | 需自己实现 UDF 数据源（`/config`、`/symbols`、`/history`、`/search` 等），由你提供数据，TradingView 只负责画图。 | ❌ 不提供数据，只是展示层 |
| **Broker REST API** | 含 `/quotes`、`/history` 等，面向**券商/合作方**，需商业合作与授权。 | ❌ 非公开、非免费 |
| **Symbol Search** | 存在未公开的 `symbol-search.tradingview.com/symbol_search/v3/` 类接口，但从服务端或 AJAX 调用常返回 **403 Forbidden**，仅浏览器直接访问可能可用。 | ❌ 不稳定、不可靠，且无正式文档 |

---

## 2. Widget（嵌入报价/图表）

- TradingView 提供 **Market Data / Quote / Symbol Info** 等**嵌入用 Widget**，用于在网页上展示行情。
- 这些 Widget 是**前端展示**，数据由 TradingView 内部拉取，**不对外暴露**可被我们直接请求的 JSON 接口。
- 无法在 SvelteKit 里用 `fetch()` 调 TradingView 拿到“纯数据”再自己渲染市场面板。

---

## 3. 第三方/非官方方式

- 存在基于 TradingView Screener 的第三方库（如 Python 的 `tradingview-screener`），面向**筛选/批量指标**，不是简单“单标的实时报价”，且需跑在服务端、非官方契约，有封禁/变更风险。
- 未发现可替代 Finnhub Quote 的、稳定且免费的 TradingView “股指报价”API。

---

## 4. 建议

- **继续使用现有方案**：用 **Finnhub Quote API**（ETF 代理 DIA/SPY/QQQ/IWM）作为市场模块的股指数据源，见 `docs/MARKETS_DATA_SOURCES.md`。
- 若希望**降低对 Finnhub 的依赖**，可考虑：
  - **Yahoo Finance（非官方）**：如 `yahoo-finance2` 等库，可查指数/ETF，需注意 ToS 与稳定性。
  - **Alpha Vantage / Twelve Data**：有免费额度，需注册 API Key，支持指数/股票。详见 [Twelve Data 可行性检查](TWELVE_DATA_CHECK.md)。
  - **Polygon.io**：有免费档，需注册。

**总结**：目前**无法**通过 TradingView 可靠、合规地获取股指信息用于本项目的市场模块；TradingView 不适合作为“可 fetch 的指数数据源”。
