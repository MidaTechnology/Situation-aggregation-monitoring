/**
 * AI module context - aggregates messages and signals from enabled panels only
 */

import type { NewsItem } from '$lib/types';
import type { PanelId } from '$lib/config/panels';
import type { Locale } from '$lib/config';
import type { CorrelationResults } from './correlation';
import type { NarrativeResults } from './narrative';
import type { MainCharacterResults } from './main-character';
import type { MonitorMatchItem } from '$lib/stores/monitors';

export interface AIMessage {
	id: string;
	panelId: string;
	source: string;
	title: string;
	description?: string;
	timestamp: number;
	isAlert?: boolean;
}

export interface AIModuleContext {
	enabledPanelIds: PanelId[];
	messageCount: number;
	alertsCount: number;
	messages: AIMessage[];
	correlationSummary: CorrelationResults | null;
	narrativeSummary: NarrativeResults | null;
	mainCharacterSummary: MainCharacterResults | null;
	monitorMatchCount: number;
	marketOneLiner: string | null;
	cryptoOneLiner: string | null;
	polymarketCount: number;
}

const NEWS_PANELS: PanelId[] = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'];
const MAX_MESSAGES = 300;

function isEnabled(enabled: Record<string, boolean>, id: PanelId): boolean {
	return enabled[id] !== false;
}

/**
 * Build AI context from enabled panels only
 */
export function buildAIContext(params: {
	enabled: Record<string, boolean>;
	newsItems: NewsItem[];
	fedItems: Array<{ id: string; title: string; link: string; description: string; timestamp: number }>;
	blockbeatsItems: Array<{ id: number; title: string; content?: string; create_time: string }>;
	predictions: Array<{ id: string; question: string }>;
	monitorMatches: Array<{ item: MonitorMatchItem }>;
	correlationResults: CorrelationResults | null;
	narrativeResults: NarrativeResults | null;
	mainCharacterResults: MainCharacterResults | null;
	indicesSummary?: string;
	cryptoSummary?: string;
}): AIModuleContext {
	const {
		enabled,
		newsItems,
		fedItems,
		blockbeatsItems,
		predictions,
		monitorMatches,
		correlationResults,
		narrativeResults,
		mainCharacterResults,
		indicesSummary,
		cryptoSummary
	} = params;

	const enabledPanelIds = (Object.keys(enabled) as PanelId[]).filter(
		(id) => id !== 'aiInsights' && id !== 'map' && enabled[id] !== false
	);

	const messages: AIMessage[] = [];

	// News (GDELT) - only if any news panel enabled
	if (NEWS_PANELS.some((id) => isEnabled(enabled, id))) {
		for (const item of newsItems) {
			messages.push({
				id: item.id,
				panelId: item.category,
				source: item.source || item.category,
				title: item.title,
				description: item.description,
				timestamp: item.timestamp,
				isAlert: item.isAlert
			});
		}
	}

	// Fed RSS
	if (isEnabled(enabled, 'fed')) {
		for (const item of fedItems) {
			messages.push({
				id: item.id,
				panelId: 'fed',
				source: 'Fed RSS',
				title: item.title,
				description: item.description,
				timestamp: item.timestamp,
				isAlert: false
			});
		}
	}

	// BlockBeats
	if (isEnabled(enabled, 'blockbeats')) {
		for (const item of blockbeatsItems) {
			const ts = item.create_time ? new Date(item.create_time).getTime() : Date.now();
			messages.push({
				id: `bb-${item.id}`,
				panelId: 'blockbeats',
				source: 'BlockBeats',
				title: item.title,
				description: item.content,
				timestamp: ts,
				isAlert: false
			});
		}
	}

	// Monitor matches (as messages)
	if (isEnabled(enabled, 'monitors')) {
		for (const m of monitorMatches) {
			messages.push({
				id: `mon-${m.item.id}-${m.item.timestamp}`,
				panelId: 'monitors',
				source: m.item.sourceLabel,
				title: m.item.title,
				timestamp: m.item.timestamp,
				isAlert: false
			});
		}
	}

	// Dedupe by id, sort by timestamp desc, cap
	messages.sort((a, b) => b.timestamp - a.timestamp);
	const seen = new Set<string>();
	const deduped = messages.filter((m) => {
		if (seen.has(m.id)) return false;
		seen.add(m.id);
		return true;
	});
	const capped = deduped.slice(0, MAX_MESSAGES);

	const alertsCount = capped.filter((m) => m.isAlert).length;

	return {
		enabledPanelIds,
		messageCount: capped.length,
		alertsCount,
		messages: capped,
		correlationSummary: isEnabled(enabled, 'correlation') ? correlationResults : null,
		narrativeSummary: isEnabled(enabled, 'narrative') ? narrativeResults : null,
		mainCharacterSummary: isEnabled(enabled, 'mainchar') ? mainCharacterResults : null,
		monitorMatchCount: isEnabled(enabled, 'monitors') ? monitorMatches.length : 0,
		marketOneLiner: isEnabled(enabled, 'markets') && indicesSummary ? indicesSummary : null,
		cryptoOneLiner: isEnabled(enabled, 'crypto') && cryptoSummary ? cryptoSummary : null,
		polymarketCount: isEnabled(enabled, 'polymarket') ? predictions.length : 0
	};
}

/**
 * Generate a short rule-based summary from context (for display before LLM is wired)
 */
export function getStructuredSummary(context: AIModuleContext, locale: Locale = 'zh'): string[] {
	const bullets: string[] = [];
	const isZh = locale === 'zh';
	const text = {
		aggregate: isZh ? '已聚合 {panels} 个模块、{messages} 条消息' : 'Aggregated {panels} panels, {messages} messages',
		alerts: isZh ? '告警/优先：{n} 条' : 'Alerts/Priority: {n}',
		correlation: isZh ? '相关性：{topics} 等主题热度上升' : 'Correlation: rising interest in {topics}',
		momentum: isZh ? '动量：{topics} 激增' : 'Momentum: {topics} surging',
		mainCharacter: isZh ? '主角：{name} 提及最多' : 'Main character: {name} most mentioned',
		narrative:
			isZh ? '叙事：存在边缘→主流或涉假信息信号，建议关注' : 'Narratives: fringe→mainstream or disinfo signals detected',
		market: isZh ? '市场：{text}' : 'Markets: {text}',
		crypto: isZh ? '加密：{text}' : 'Crypto: {text}',
		monitor: isZh ? '监控匹配：{n} 条' : 'Monitor matches: {n}',
		polymarket: isZh ? 'Polymarket：{n} 个预测市场' : 'Polymarket: {n} markets'
	};

	// Always show at least one line so "综合摘要" and "生成总结" are visible
	bullets.push(
		text.aggregate
			.replace('{panels}', String(context.enabledPanelIds.length))
			.replace('{messages}', String(context.messageCount))
	);
	if (context.messageCount === 0) {
		return bullets;
	}
	if (context.alertsCount > 0) {
		bullets.push(text.alerts.replace('{n}', String(context.alertsCount)));
	}

	if (context.correlationSummary) {
		const { emergingPatterns, momentumSignals } = context.correlationSummary;
		if (emergingPatterns.length > 0) {
			const top = emergingPatterns.slice(0, 2).map((p) => p.name).join('、');
			bullets.push(text.correlation.replace('{topics}', top));
		}
		if (momentumSignals.length > 0) {
			const surging = momentumSignals.filter((s) => s.momentum === 'surging');
			if (surging.length > 0) {
				bullets.push(
					text.momentum.replace('{topics}', surging.map((s) => s.name).join(isZh ? '、' : ', '))
				);
			}
		}
	}

	if (context.mainCharacterSummary?.topCharacter) {
		bullets.push(
			text.mainCharacter.replace('{name}', context.mainCharacterSummary.topCharacter.name)
		);
	}

	if (context.narrativeSummary) {
		const { fringeToMainstream, disinfoSignals } = context.narrativeSummary;
		if (fringeToMainstream.length > 0 || disinfoSignals.length > 0) {
			bullets.push(text.narrative);
		}
	}

	if (context.marketOneLiner) {
		bullets.push(text.market.replace('{text}', context.marketOneLiner));
	}
	if (context.cryptoOneLiner) {
		bullets.push(text.crypto.replace('{text}', context.cryptoOneLiner));
	}

	if (context.monitorMatchCount > 0) {
		bullets.push(text.monitor.replace('{n}', String(context.monitorMatchCount)));
	}
	if (context.polymarketCount > 0) {
		bullets.push(text.polymarket.replace('{n}', String(context.polymarketCount)));
	}

	return bullets;
}
