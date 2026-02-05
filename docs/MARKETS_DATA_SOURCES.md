# 市场模块数据来源分析

## 概述

「市场」面板（MarketsPanel）**只展示股指（indices）**：道琼斯、标普 500、纳斯达克、Russell 2000。  
同一套拉取逻辑还会填充 **sectors（板块 ETF）**、**commodities（大宗/VIX）**、**crypto（加密货币）**，分别给热力图、大宗面板、加密货币面板用；市场面板只消费 **indices**。

---

## 数据流（市场面板用到的部分）

```
+page.svelte  loadMarkets()
       ↓
api/markets.ts  fetchAllMarkets(cryptoCoins, commodityConfigs)
       ↓  Promise.all([
       │    fetchCryptoPrices(),
       │    fetchIndices(),        ← 市场面板用这一路
       │    fetchSectorPerformance(),
       │    fetchCommodities()
       │  ])
       ↓
markets.setIndices(data.indices)
       ↓
stores/markets.ts  indices: { items, loading, error, lastUpdated }
       ↓  derived
indices store (indices = derived(markets, $markets => $markets.indices))
       ↓
MarketsPanel.svelte  使用 $indices.items / $indices.loading / $indices.error
```

---

## 市场面板实际用的数据：indices

- **来源**：`src/lib/api/markets.ts` 的 `fetchIndices()`。
- **接口**：**Finnhub Quote API**（需配置 `VITE_FINNHUB_API_KEY`）。
- **配置**：`src/lib/config/markets.ts` 的 `INDICES`：
  - `^DJI` 道琼斯
  - `^GSPC` 标普 500
  - `^IXIC` 纳斯达克
  - `^RUT` Russell 2000
- **实现细节**：
  - Finnhub 免费层不直接支持指数代码，用 **ETF 代理** 取价（`api/markets.ts` 里 `INDEX_ETF_MAP`）：
    - `^DJI` → DIA
    - `^GSPC` → SPY
    - `^IXIC` → QQQ
    - `^RUT` → IWM
  - 每个指数/ETF 调一次 Finnhub：`GET ${FINNHUB_BASE_URL}/quote?symbol=...&token=...`，走 `fetchWithProxy`（CORS 代理）。
  - 返回字段映射：`c`→price, `d`→change, `dp`→changePercent，再套上 `INDICES` 的 symbol/name，`type: 'index'`。
- **无 key 时**：返回 4 条空项（NaN），不报错。

---

## 同一次拉取里其它数据（市场面板不直接显示）

| 数据 | API 函数 | 外部来源 | 写入 store | 谁用 |
|------|----------|----------|------------|------|
| **indices** | `fetchIndices()` | Finnhub Quote（ETF 代理） | `markets.setIndices` | **市场面板** |
| sectors | `fetchSectorPerformance()` | Finnhub Quote（XLK/XLF 等 ETF） | `markets.setSectors` | 板块热力图等 |
| commodities | `fetchCommodities()` | Finnhub Quote（^VIX/GC=F 等） | `markets.setCommodities` | 大宗/VIX 面板 |
| crypto | `fetchCryptoPrices()` | CoinGecko simple/price | `markets.setCrypto` | 加密货币面板 |

---

## 触发拉取

- **首次 / 刷新**：`+page.svelte` 的 `handleRefresh()` 里会调 `loadMarkets()`（和 loadNews、loadMiscData 等一起）。
- **重试**：市场面板的「重试」按钮 `onRetry={loadMarkets}`。
- **配置变更**：大宗/加密货币面板里增删品种后，会调 `onCommodityListChange={loadMarkets}` / `onCryptoListChange={loadMarkets}`，再次执行 `loadMarkets()`，从而重新拉 indices + sectors + commodities + crypto。

---

## 小结

- **市场模块（MarketsPanel）的数据来源**：仅 **indices**，来自 **Finnhub Quote API**，用 DIA/SPY/QQQ/IWM 四个 ETF 代理道琼斯/标普/纳斯达克/Russell 2000。
- **配置**：`.env` 中 `VITE_FINNHUB_API_KEY`；指数列表在 `config/markets.ts` 的 `INDICES`。
- **存储**：`markets` store 的 `indices`，页面通过派生 store `indices` 读取；同一套 `loadMarkets` 还更新 sectors/commodities/crypto 供其他面板使用。
