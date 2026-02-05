# AI 分析模块设计

## 一、目标

新增一个 **「AI 分析」** 面板，基于**当前勾选（启用）的模块**聚合消息与趋势，做跨源综合分析，并预留后续接入大模型生成总结的能力。

## 二、设计原则

1. **只使用已启用面板的数据**：根据 `settings.enabled` 决定哪些面板参与聚合，避免未勾选模块干扰结论。
2. **统一上下文结构**：把多源数据整理成「消息列表 + 结构化信号」，便于规则汇总和未来传给 LLM。
3. **先规则、后 AI**：当前用规则生成「综合摘要」；预留接口，后续可接入 API 生成自然语言总结。

## 三、数据聚合（按启用面板）

| 面板 ID | 数据类型 | 聚合内容 |
|--------|----------|----------|
| politics, tech, finance, gov, ai, intel | 新闻 | 标题、描述、来源、时间、是否告警；合并为「消息」列表 |
| fed | Fed RSS | 标题、描述、来源、时间 |
| blockbeats | 快讯 | 标题、内容、链接、时间 |
| polymarket | 预测市场 | 问题文本、概率、成交量（作为趋势信号） |
| monitors | 监控匹配 | 匹配到的标题、来源、关键词 |
| correlation | 相关性引擎 | 已有结果：新兴模式、动量、跨源相关、预测信号（不重复拉原始新闻） |
| narrative | 叙事追踪 | 已有结果：叙事类别与严重程度 |
| mainchar | 主角分析 | 已有结果：人物排名与提及次数 |
| markets | 市场 | 指数/板块涨跌、可作为一句趋势描述 |
| crypto | 加密货币 | 涨跌、可作为一句趋势描述 |
| intel | 情报源 | 与新闻重叠，可去重或标出来源类型 |
| leaders, contracts, layoffs, whales | 可选 | 数量/头条摘要，参与「趋势一句话」 |

- **消息**：来自新闻类、Fed、BlockBeats、监控匹配等，每条带 `source, title, description?, timestamp, panelId`。
- **趋势/信号**：来自 correlation、narrative、mainchar、markets、crypto 等，只取已启用面板的现有分析结果。

## 四、统一上下文类型（供规则汇总与未来 LLM）

```ts
interface AIModuleContext {
  // 仅包含「当前启用」的面板
  enabledPanelIds: PanelId[];
  // 聚合消息（去重、按时间排序）
  messages: Array<{
    id: string;
    panelId: string;
    source: string;
    title: string;
    description?: string;
    timestamp: number;
    isAlert?: boolean;
  }>;
  // 结构化信号（来自已启用的分析面板）
  correlationSummary: CorrelationResults | null;   // 仅当 correlation 启用
  narrativeSummary: NarrativeResults | null;       // 仅当 narrative 启用
  mainCharacterSummary: MainCharacterResults | null; // 仅当 mainchar 启用
  alertsCount: number;
  marketOneLiner?: string;   // 仅当 markets 启用
  cryptoOneLiner?: string;   // 仅当 crypto 启用
  // 可选：Polymarket 热点、监控匹配数等
}
```

- 规则层/LLM 都只消费 `AIModuleContext`，便于扩展。

## 五、面板展示内容（UI）

1. **聚合统计**  
   - 已纳入分析的模块数、消息总数、告警条数。

2. **综合摘要（规则生成）**  
   - 2–4 条要点，例如：  
     - 相关性：当前最突出的主题与动量（来自 correlation）。  
     - 叙事：若启用 narrative，则叙事类别与严重程度。  
     - 主角：若启用 mainchar，则今日/当前「主角」人物。  
     - 风险/告警：告警条数 + 一句概括（如「涉及利率/地缘/市场」）。

3. **「AI 总结」占位（预留 LLM）**  
   - 展示区 +「生成总结」按钮。  
   - 当前可灰显或显示「接入 API 后生成」；后续请求时把 `AIModuleContext`（或压缩后的 prompt）发给后端/LLM，展示返回文本。

4. **数据来源说明**  
   - 简短说明：「本分析基于当前已勾选的 N 个模块」。

## 六、技术实现要点

1. **上下文构建位置**  
   - 在页面或 store 中，根据 `$settings.enabled` 与各 store（news, fedNews, blockbeats, monitors, …）计算 `AIModuleContext`（可用 `$derived`），只聚合启用面板的数据。

2. **新面板 ID**  
   - 建议新增 `aiInsights`（与现有新闻分类 `ai` 区分），配置名称为「AI 分析」，排在相关性/叙事附近。

3. **去重与条数限制**  
   - 消息按 `id` 或 `title+source` 去重；总条数可截断（如最近 200 条）避免 payload 过大，为后续 LLM 预留合理长度。

4. **扩展点**  
   - 预留 `generateAISummary(context: AIModuleContext): Promise<string>`，内部可调用后端或直接调 LLM API；AI 面板只消费该函数返回的字符串并展示。

## 七、与现有模块的关系

- **相关性引擎 / 叙事追踪 / 主角分析**：只产出结构化结果，不重复拉原始新闻；AI 模块只「引用」这些结果并纳入摘要。  
- **新闻 / Fed / BlockBeats / 监控**：提供原始消息流，由 AI 模块做跨源聚合与时间排序。  
- **市场 / 加密货币**：提供数字与涨跌，由 AI 模块生成一句趋势描述（规则即可）。

按上述设计，可实现「只分析全局勾选模块的消息和趋势」，并为后续接入真实 AI 总结留好接口与数据结构。
