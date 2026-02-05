# 巨鲸动向数据 API 可选方案

除 **Whale Alert** 外，可通过以下 API 获取大额转账 / 巨鲸动向数据（部分有免费额度）。

---

## 1. Whale Alert（官方）

- **官网 / 文档**：https://developer.whale-alert.io/
- **免费**：提供 **24 小时样本数据**（gzip JSON），非商用可用
  - 地址：https://developer.whale-alert.io/sample-data/
  - 链：Bitcoin, Ethereum, Solana, Polygon, Tron, Litecoin, Bitcoin Cash, Algorand
  - 另有 ≥1000 万美元的 alerts 样本（Bitcoin / Ethereum）
- **付费**：REST API 需企业方案；Custom Alerts 约 $29.95/月

---

## 2. Etherscan（Ethereum / EVM）

- **文档**：https://docs.etherscan.io/
- **免费**：注册后拿 API Key，有免费额度
- **用途**：按地址查 **ERC20 代币转账**、普通 ETH 交易；可筛大额、按时间排序
- **端点示例**：`tokentx`（代币转账）、`txlist`（地址交易列表）
- **注意**：需自己按金额/代币过滤「巨鲸」；多链要用对应链的 explorer API（BscScan、PolygonScan 等）

---

## 3. Alchemy（多链）

- **文档**：https://docs.alchemy.com/reference/transfers-api-quickstart
- **免费**：有免费档，按 Compute Units 计费
- **用途**：**Transfers API** 可查地址的历史转账（ETH、ERC20、ERC721、内部转账等），不扫全链
- **链**：Ethereum 及 L2 等

---

## 4. Bitquery（多链 GraphQL）

- **文档**：https://docs.bitquery.io/ （EVM Token Transfers 等）
- **免费**：Developer 免费计划（约 10k points、10 行/请求、10 请求/分钟）
- **用途**：GraphQL 查 **EVM 代币转账**，有现成的「whale transfer」示例查询
- **链**：40+ 条链

---

## 5. Moralis（多链）

- **文档**：https://docs.moralis.io/
- **免费**：免费档约 40,000 Compute Units/天
- **用途**：Wallet API 查地址 **交易/转账**；Streams 可监听链上事件（免费档 1 个 stream）
- **链**：多链

---

## 6. Nansen（偏机构/付费）

- **官网**：https://www.nansen.ai/
- **用途**：链上标签、巨鲸/机构动向、资金流；API 偏企业付费
- **适合**：有预算时做深度链上分析

---

## 7. 其他思路

- **区块浏览器 API**：BscScan、PolygonScan、Solscan 等，按链查大额转账或大户地址。
- **Dune Analytics**：写 SQL 查链上数据，可导出或通过 API 用；免费有额度限制。
- **WhaleQuant 等**：多为看板/聚合产品，是否有公开 API 需查官网。

---

## 接入建议（本项目）

1. **先试 Whale Alert 免费样本**：固定 URL 拉 `sample-data` 下某日 JSON，解析后映射到当前 `WhaleTransaction` 结构，无需 API Key。
2. **要实时/多链**：优先考虑 **Etherscan（EVM）+ Whale Alert 样本（BTC 等）** 组合；或 **Bitquery / Moralis** 免费档做 PoC。
3. **统一接口**：在 `src/lib/api/misc.ts` 里保留 `fetchWhaleTransactions(symbols?)`，内部按配置选择「模拟 / Whale Alert 样本 / Etherscan / …」一种实现即可。
