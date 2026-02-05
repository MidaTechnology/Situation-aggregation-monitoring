/**
 * Onboarding presets for first-time users
 */

import type { PanelId } from './panels';

export interface Preset {
	id: string;
	name: string;
	icon: string;
	description: string;
	panels: PanelId[];
}

export const PRESETS: Record<string, Preset> = {
	'news-junkie': {
		id: 'news-junkie',
		name: '资讯优先',
		icon: '📰',
		description: '政治、科技、财经要闻与主角分析',
		panels: ['politics', 'tech', 'finance', 'gov', 'ai', 'mainchar', 'map']
	},
	trader: {
		id: 'trader',
		name: '交易员',
		icon: '📈',
		description: '股票、加密货币、大宗与预测市场',
		panels: [
			'markets',
			'heatmap',
			'commodities',
			'crypto',
			'polymarket',
			'whales',
			'blockbeats',
			'printer',
			'finance',
			'map'
		]
	},
	geopolitics: {
		id: 'geopolitics',
		name: '地缘观察',
		icon: '🌍',
		description: '全球态势与区域热点',
		panels: [
			'map',
			'intel',
			'leaders',
			'politics',
			'gov',
			'venezuela',
			'greenland',
			'iran',
			'correlation',
			'narrative'
		]
	},
	intel: {
		id: 'intel',
		name: '情报分析',
		icon: '🔍',
		description: '深度分析、模式与叙事追踪',
		panels: ['map', 'intel', 'leaders', 'correlation', 'narrative', 'aiInsights', 'mainchar', 'politics']
	},
	minimal: {
		id: 'minimal',
		name: '极简',
		icon: '⚡',
		description: '仅保留地图、新闻与市场',
		panels: ['map', 'politics', 'markets']
	},
	everything: {
		id: 'everything',
		name: '全部',
		icon: '🎛️',
		description: '启用所有面板',
		panels: [
			'map',
			'politics',
			'tech',
			'finance',
			'gov',
			'heatmap',
			'markets',
			'monitors',
			'commodities',
			'crypto',
			'polymarket',
			'whales',
			'mainchar',
			'printer',
			'contracts',
			'ai',
			'layoffs',
			'venezuela',
			'greenland',
			'iran',
			'leaders',
			'intel',
			'correlation',
			'narrative',
			'aiInsights',
			'fed',
			'blockbeats'
		]
	}
};

export const PRESET_ORDER = [
	'news-junkie',
	'trader',
	'geopolitics',
	'intel',
	'minimal',
	'everything'
];

// Storage keys
export const ONBOARDING_STORAGE_KEY = 'onboardingComplete';
export const PRESET_STORAGE_KEY = 'selectedPreset';
