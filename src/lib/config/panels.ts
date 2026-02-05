/**
 * Panel configuration
 */

export interface PanelConfig {
	name: string;
	priority: 1 | 2 | 3;
}

export type PanelId =
	| 'map'
	| 'politics'
	| 'tech'
	| 'finance'
	| 'gov'
	| 'heatmap'
	| 'markets'
	| 'monitors'
	| 'commodities'
	| 'crypto'
	| 'polymarket'
	| 'whales'
	| 'mainchar'
	| 'printer'
	| 'contracts'
	| 'ai'
	| 'layoffs'
	| 'venezuela'
	| 'greenland'
	| 'iran'
	| 'leaders'
	| 'intel'
	| 'correlation'
	| 'narrative'
	| 'fed'
	| 'blockbeats'
	| 'aiInsights';

export const PANELS: Record<PanelId, PanelConfig> = {
	map: { name: '全球地图', priority: 1 },
	politics: { name: '国际 / 地缘', priority: 1 },
	tech: { name: '科技 / AI', priority: 1 },
	finance: { name: '财经', priority: 1 },
	gov: { name: '政府 / 政策', priority: 2 },
	heatmap: { name: '板块热力图', priority: 1 },
	markets: { name: '市场', priority: 1 },
	monitors: { name: '我的监控', priority: 1 },
	commodities: { name: '大宗 / VIX', priority: 2 },
	crypto: { name: '加密货币', priority: 2 },
	polymarket: { name: 'Polymarket', priority: 2 },
	whales: { name: '巨鲸动向', priority: 3 },
	mainchar: { name: '主角分析', priority: 2 },
	printer: { name: '印钞机', priority: 2 },
	contracts: { name: '政府合同', priority: 3 },
	ai: { name: 'AI 军备', priority: 3 },
	layoffs: { name: '裁员追踪', priority: 3 },
	venezuela: { name: '委内瑞拉局势', priority: 2 },
	greenland: { name: '格陵兰局势', priority: 2 },
	iran: { name: '伊朗局势', priority: 2 },
	leaders: { name: '世界领导人', priority: 1 },
	intel: { name: '情报源', priority: 2 },
	correlation: { name: '相关性引擎', priority: 1 },
	narrative: { name: '叙事追踪', priority: 1 },
	fed: { name: '美联储', priority: 1 },
	blockbeats: { name: 'BlockBeats 快讯', priority: 2 },
	aiInsights: { name: 'AI 分析', priority: 1 }
};

export const NON_DRAGGABLE_PANELS: PanelId[] = ['map'];

/** Default panel order for dashboard (used when computing display order with pinned first) */
export const PANEL_ORDER: PanelId[] = [
	'map',
	'politics',
	'tech',
	'finance',
	'gov',
	'ai',
	'markets',
	'heatmap',
	'commodities',
	'crypto',
	'mainchar',
	'correlation',
	'narrative',
	'aiInsights',
	'intel',
	'blockbeats',
	'fed',
	'leaders',
	'venezuela',
	'greenland',
	'iran',
	'whales',
	'polymarket',
	'contracts',
	'layoffs',
	'printer',
	'monitors'
];

export const MAP_ZOOM_MIN = 1;
export const MAP_ZOOM_MAX = 4;
export const MAP_ZOOM_STEP = 0.5;
