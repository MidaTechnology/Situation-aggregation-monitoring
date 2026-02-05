# Twelve Data 作为股指数据源的可行性检查

## 结论：**可以**作为市场模块的备选数据源，免费档适合测试与小流量

Twelve Data 提供**免费 Basic 计划**，具备 `/quote`、`/price` 等实时报价接口，支持美股指数及 5000+ 全球指数；受**每分钟/每日额度**限制，适合做 Finnhub 的补充或替代（测试/轻量场景）。

---

## 1. 免费档与额度

| 项目 | Basic (Free) |
|------|----------------|
| **每分钟** | 8 API credits |
| **每日** | 800 API credits |
| **报价类接口** | `/quote`、`/price` 均为 **1 credit/每标的** |
| **覆盖** | 美股、ETF、外汇、加密货币等；指数 5000+ 全球 |

若市场面板只拉 4 个指数（如道琼斯、标普、纳斯达克、Russell 2000），每次刷新 = 4 次请求 = 4 credits；每分钟 8 credits 即最多约 2 次全量刷新/分钟，每日 800 次约 200 次全量刷新，**适合低频刷新（如 1–2 分钟一次）或仅作备用源**。

---

## 2. 与本项目相关的接口

### 2.1 Quote（推荐用于市场面板）

- **路径**：`GET https://api.twelvedata.com/quote?symbol=SYMBOL&apikey=KEY`
- **Credits**：1 per symbol
- **返回**：`open`、`high`、`low`、`close`、`previous_close`、`change`、`percent_change`、`volume` 等，可直接映射到当前 MarketsPanel 的 price / change / changePercent。

### 2.2 Latest Price

- **路径**：`GET https://api.twelvedata.com/price?symbol=SYMBOL&apikey=KEY`
- **Credits**：1 per symbol
- **返回**：仅 `price`，适合只要最新价的场景。

### 2.3 指数列表与符号

- **参考**：`/stocks`、`/etfs` 等目录接口；`instrument_type` 含 **Index**。
- **常见美股指数符号**（Twelve Data 风格）：如 **SPX**（标普 500）、**INDU** 或 **DJI**（道琼斯）、**IXIC**（纳斯达克）、**RUT**（Russell 2000）。与 Yahoo/Finnhub 的 `^GSPC`、`^DJI` 等不同，需做一层 symbol 映射。
- 若某指数在免费档不可用，可像 Finnhub 一样用 **ETF 代理**（如 SPY、DIA、QQQ、IWM）调用 `/quote`。

---

## 3. 与本项目集成要点

- **环境变量**：例如 `VITE_TWELVE_DATA_API_KEY`，仅在客户端需要时暴露给前端（或经后端代理转发，避免 key 暴露）。
- **Symbol 映射**：在 `config/markets.ts` 或 api 层维护「显示用指数 id → Twelve Data symbol」映射（如 `^GSPC` → `SPX` 或 `SPY`）。
- **限速**：建议 1 分钟内不超过 8 次报价请求（或 4 指数 × 2 次刷新），可配合现有 `loadMarkets` 的调用频率与缓存，避免 429。
- **错误与降级**：请求失败或 429 时，可回退到 Finnhub（若已配置）或仅显示缓存/占位。

---

## 4. 建议

- **继续使用 Finnhub** 作为主源：见 `docs/MARKETS_DATA_SOURCES.md`。
- **将 Twelve Data 作为可选备用或替代**：
  - 在 `api/markets.ts` 中增加 Twelve Data 的 `fetchIndicesFromTwelveData()`，当 `VITE_TWELVE_DATA_API_KEY` 存在且 Finnhub 不可用或主动选择时使用；
  - 或单独做一个「数据源选择」配置（Finnhub / Twelve Data），便于切换与 A/B 测试。
- **免费档注意**：每分钟 8、每日 800 credits 限制下，不宜高频刷新；若需更高 QPS，需考虑付费计划。

**总结**：Twelve Data 具备可用的免费档与标准 Quote API，**适合**作为本项目的股指数据备选或补充；集成时注意 symbol 映射与限速即可。
