/**
 * 中英文界面文案与 getPanelName / getPreset
 */

import type { PanelId } from './panels';

export type Locale = 'zh' | 'en';

const PANEL_NAMES: Record<Locale, Record<PanelId, string>> = {
	zh: {
		map: '全球地图',
		politics: '国际 / 地缘',
		tech: '科技 / AI',
		finance: '财经',
		gov: '政府 / 政策',
		heatmap: '板块热力图',
		markets: '市场',
		monitors: '我的监控',
		commodities: '大宗 / VIX',
		crypto: '加密货币',
		polymarket: 'Polymarket',
		whales: '巨鲸动向',
		mainchar: '主角分析',
		printer: '印钞机',
		contracts: '政府合同',
		ai: 'AI 军备',
		layoffs: '裁员追踪',
		venezuela: '委内瑞拉局势',
		greenland: '格陵兰局势',
		iran: '伊朗局势',
		leaders: '世界领导人',
		intel: '情报源',
		correlation: '相关性引擎',
		narrative: '叙事追踪',
		fed: '美联储',
		blockbeats: 'BlockBeats 快讯',
		aiInsights: 'AI 分析'
	},
	en: {
		map: 'Global Map',
		politics: 'World / Geopolitical',
		tech: 'Technology / AI',
		finance: 'Financial',
		gov: 'Government / Policy',
		heatmap: 'Sector Heatmap',
		markets: 'Markets',
		monitors: 'My Monitors',
		commodities: 'Commodities / VIX',
		crypto: 'Crypto',
		polymarket: 'Polymarket',
		whales: 'Whale Watch',
		mainchar: 'Main Character',
		printer: 'Money Printer',
		contracts: 'Gov Contracts',
		ai: 'AI Arms Race',
		layoffs: 'Layoffs Tracker',
		venezuela: 'Venezuela Situation',
		greenland: 'Greenland Situation',
		iran: 'Iran Situation',
		leaders: 'World Leaders',
		intel: 'Intel Feed',
		correlation: 'Correlation Engine',
		narrative: 'Narrative Tracker',
		fed: 'Federal Reserve',
		blockbeats: 'BlockBeats Flash',
		aiInsights: 'AI Insights'
	}
};

const PRESET_TEXTS: Record<
	Locale,
	Record<string, { name: string; description: string; audience?: string }>
> = {
	zh: {
		'news-junkie': {
			name: '资讯优先',
			description: '政治、科技、财经要闻与主角分析',
			audience: '适合关注时政与财经的读者'
		},
		trader: {
			name: '交易员',
			description: '股票、加密货币、大宗与预测市场',
			audience: '适合盯盘与市场决策'
		},
		geopolitics: {
			name: '地缘观察',
			description: '全球态势与区域热点',
			audience: '适合关注地缘与冲突的读者'
		},
		intel: {
			name: '情报分析',
			description: '深度分析、模式与叙事追踪',
			audience: '适合深度研究与叙事追踪'
		},
		minimal: {
			name: '极简',
			description: '仅保留地图、新闻与市场',
			audience: '适合轻量浏览'
		},
		everything: {
			name: '全部',
			description: '启用所有面板',
			audience: '适合全功能使用'
		}
	},
	en: {
		'news-junkie': {
			name: 'News Junkie',
			description: 'Breaking news across politics, tech, and finance',
			audience: 'Best for readers who follow politics and markets'
		},
		trader: {
			name: 'Trader',
			description: 'Market-focused: stocks, crypto, commodities',
			audience: 'Best for day trading and market decisions'
		},
		geopolitics: {
			name: 'Geopolitics Watcher',
			description: 'Global situation and regional hotspots',
			audience: 'Best for geopolitics and conflict watchers'
		},
		intel: {
			name: 'Intelligence Analyst',
			description: 'Deep analysis and narrative tracking',
			audience: 'Best for deep research and narrative tracking'
		},
		minimal: {
			name: 'Minimal',
			description: 'Just map, news, and markets',
			audience: 'Best for lightweight browsing'
		},
		everything: {
			name: 'Everything',
			description: 'All panels enabled',
			audience: 'Best for full-feature use'
		}
	}
};

export const UI_TEXTS: Record<
	Locale,
	{
		header: {
			logo: string;
			refreshing: string;
			lastUpdated: string;
			neverRefreshed: string;
			settings: string;
		};
		modal: { close: string };
		settings: {
			title: string;
			dashboard: string;
			language: string;
			background: string;
			themeDark: string;
			themeLight: string;
			enabledPanels: string;
			sectionDesc: string;
			reconfigure: string;
			btnHint: string;
			reset: string;
			autoRefresh: string;
			autoRefreshInterval: string;
			interval1m: string;
			interval5m: string;
			interval15m: string;
			interval30m: string;
			interval1h: string;
			customInterval: string;
			customMinutes: string;
		};
		onboarding: {
			welcome: string;
			subtitle: string;
			skip: string;
			hint: string;
			panelsCount: string;
		};
		monitorForm: {
			editMonitor: string;
			createMonitor: string;
			name: string;
			keywords: string;
			placeholderName: string;
			placeholderKeywords: string;
			formHint: string;
			enabled: string;
			delete: string;
			cancel: string;
			saveChanges: string;
			create: string;
			nameRequired: string;
			keywordRequired: string;
			maxMonitors: string;
		};
		/** AI Insights: API key settings modal */
		aiSettings: {
			title: string;
			provider: string;
			apiKey: string;
			apiKeyPlaceholder: string;
			model: string;
			modelOptional: string;
			save: string;
			cancel: string;
			hint: string;
		};
		/** AI Insights panel strings */
		aiInsights: {
			settingsLabel: string;
			statsEnabledPanels: string;
			statsMessages: string;
			statsAlerts: string;
			summaryTitle: string;
			aiSummaryTitle: string;
			generating: string;
			retry: string;
			regenerate: string;
			generate: string;
			placeholderNeedData: string;
			placeholderNeedKey: string;
			requestFailed: string;
		};
		common: {
			retry: string;
			loading: string;
			empty: string;
			openInNewTab: string;
			showMore: string;
			showLess: string;
			moreItems: string;
		};
		/** Small labels/badges on message bar and panels (ALERT, POWELL, VIDEO, intel types, etc.) */
		tags: {
			alert: string;
			powell: string;
			video: string;
			intelSourceType: Record<string, string>;
			intelRegion: Record<string, string>;
			intelTopic: Record<string, string>;
			fedType: Record<string, string>;
			narrativeStatus: Record<string, string>;
			narrativeSeverity: Record<string, string>;
			correlationLevel: Record<string, string>;
		};
		/** Empty state messages per panel/category */
		empty: {
			default: string;
			news: string;
			markets: string;
			mainChar: string;
			correlation: string;
			narrative: string;
			contracts: string;
			layoffs: string;
			polymarket: string;
			fed: string;
			leaders: string;
			intel: string;
			blockbeats: string;
			heatmap: string;
			crypto: string;
			commodities: string;
			monitors: string;
			printer: string;
			situation: string;
			insufficientData: string;
			noPatterns: string;
			noNarratives: string;
			aiInsights: string;
		};
		situation: {
			venezuela: { title: string; subtitle: string };
			greenland: { title: string; subtitle: string };
			iran: { title: string; subtitle: string };
		};
		panels: {
			globalSituation: string;
			fedBalance: string;
			mainCharLabel: string;
			mainCharMentions: string;
			panelsCount: string;
			closePanel: string;
			togglePanel: string;
			pinPanel: string;
			unpinPanel: string;
			activeCount: string;
		};
		contracts: {
			billion: string;
			million: string;
			thousand: string;
		};
		correlation: {
			emergingPatterns: string;
			momentumSignals: string;
			crossSourceLinks: string;
			predictiveSignals: string;
			items: string;
			sources: string;
			confidence: string;
		};
		narrative: { mentions: string };
		map: {
			zoomIn: string;
			zoomOut: string;
			reset: string;
			legendHigh: string;
			legendElevated: string;
			legendLow: string;
		};
		/** Map place names (oceans, chokepoints, hotspots) for i18n */
		mapPlaces: {
			oceans: Record<string, string>;
			chokepoints: Record<string, string>;
			hotspots: Record<string, string>;
		};
		monitors: {
			createMonitor: string;
			disable: string;
			enable: string;
			edit: string;
			delete: string;
		};
		fed: { noApiKey: string };
		crypto: {
			addCoin: string;
			addCoinModalTitle: string;
			remove: string;
			maxReached: string;
			searchPlaceholder: string;
			searchStockPlaceholder: string;
			noMatch: string;
			allAdded: string;
			presetLabel: string;
			searchLabel: string;
			searching: string;
		};
		whale: {
			addAddress: string;
			addAddressModalTitle: string;
			addressPlaceholder: string;
			invalidAddress: string;
			maxReached: string;
			watchedAddresses: string;
			remove: string;
			emptyHint: string;
			emptyTx: string;
			confirmAdd: string;
			balanceSection: string;
			transactionsSection: string;
			emptyBalance: string;
			productionHint: string;
		};
		/** Panel header status labels (VIX + situation threat level) */
		status: {
			highFear: string;
			elevated: string;
			low: string;
			critical: string;
			monitoring: string;
		};
		/** Commodity display names by symbol (^VIX, GC=F, etc.) */
		commodities: Record<string, string>;
		/** Add-commodity modal / picker (大宗添加) */
		commodityPicker: {
			addCommodity: string;
			addCommodityModalTitle: string;
			remove: string;
			maxReached: string;
			searchPlaceholder: string;
			searchStockPlaceholder: string;
			noMatch: string;
			allAdded: string;
			presetLabel: string;
			searchLabel: string;
			searching: string;
		};
		/** Add index/stock to markets panel */
		marketPicker: {
			addMore: string;
			modalTitle: string;
			remove: string;
			maxReached: string;
			searchPlaceholder: string;
			searchStockPlaceholder: string;
			noMatch: string;
			allAdded: string;
			presetLabel: string;
			searchLabel: string;
			searching: string;
		};
	}
> = {
	zh: {
		header: {
			logo: '态势监控',
			refreshing: '刷新中…',
			lastUpdated: '更新时间：',
			neverRefreshed: '尚未刷新',
			settings: '设置'
		},
		modal: { close: '关闭' },
		settings: {
			title: '设置',
			dashboard: '仪表盘',
			language: '语言',
			background: '背景颜色',
			themeDark: '深色',
			themeLight: '白色',
			enabledPanels: '启用面板',
			sectionDesc: '开关面板以自定义仪表盘',
			reconfigure: '重新配置仪表盘',
			btnHint: '选择预设以切换面板组合',
			reset: '恢复全部默认',
			autoRefresh: '自动刷新',
			autoRefreshInterval: '刷新间隔',
			interval1m: '1 分钟',
			interval5m: '5 分钟',
			interval15m: '15 分钟',
			interval30m: '30 分钟',
			interval1h: '1 小时',
			customInterval: '自定义',
			customMinutes: '分钟'
		},
		onboarding: {
			welcome: '欢迎使用态势监控',
			subtitle: '选择一种配置开始使用',
			skip: '跳过',
			hint: '之后可在设置中修改',
			panelsCount: '个面板'
		},
		monitorForm: {
			editMonitor: '编辑监控',
			createMonitor: '新建监控',
			name: '名称',
			keywords: '关键词（逗号分隔）',
			placeholderName: '例如：乌克兰局势',
			placeholderKeywords: '例如：ukraine, zelensky, kyiv',
			formHint: '命中任一关键词的新闻会出现在该监控中',
			enabled: '启用',
			delete: '删除',
			cancel: '取消',
			saveChanges: '保存',
			create: '创建',
			nameRequired: '请填写名称',
			keywordRequired: '请至少填写一个关键词',
			maxMonitors: '监控数量已达上限（20）'
		},
		aiSettings: {
			title: 'AI 总结 API 设置',
			provider: '服务商',
			apiKey: 'API Key',
			apiKeyPlaceholder: 'sk-xxx（仅保存在本机，不会上传）',
			model: '模型',
			modelOptional: '可选，留空使用默认',
			save: '保存',
			cancel: '取消',
			hint: '支持 DeepSeek、ChatGPT（OpenAI）等，填入对应 API Key 即可生成总结。'
		},
		aiInsights: {
			settingsLabel: 'AI API 设置',
			statsEnabledPanels: '已启用 {n} 个模块',
			statsMessages: '{n} 条消息',
			statsAlerts: '{n} 条告警',
			summaryTitle: '综合摘要',
			aiSummaryTitle: 'AI 总结',
			generating: '正在生成…',
			retry: '重试',
			regenerate: '重新生成',
			generate: '生成总结',
			placeholderNeedData: '请先启用要分析的模块并等待数据加载',
			placeholderNeedKey:
				'点击右上角设置按钮填入 API Key（支持 DeepSeek、ChatGPT 等），或在 .env 中配置 VITE_AI_API_KEY。',
			requestFailed:
				'请求失败（可能是跨域）。请用本地代理或后端转发 DeepSeek API，或使用 npm run dev 通过 SvelteKit 服务端转发。'
		},
		common: {
			retry: '重试',
			loading: '加载中…',
			empty: '暂无数据',
			openInNewTab: '在新窗口打开',
			showMore: '展开更多',
			showLess: '收起',
			moreItems: '还有 {n} 条'
		},
		tags: {
			alert: '告警',
			powell: '鲍威尔',
			video: '视频',
			intelSourceType: {
				osint: '开源情报',
				govt: '政府',
				cyber: '网络',
				defense: '防务',
				regional: '区域',
				'think-tank': '智库'
			},
			intelRegion: {
				EUROPE: '欧洲',
				MENA: '中东与北非',
				APAC: '亚太',
				AMERICAS: '美洲',
				AFRICA: '非洲'
			},
			intelTopic: {
				CYBER: '网络安全',
				NUCLEAR: '核问题',
				CONFLICT: '冲突',
				INTEL: '情报',
				DEFENSE: '防务',
				DIPLO: '外交'
			},
			fedType: {
				monetary: '货币政策',
				powell: '鲍威尔',
				speech: '演讲',
				testimony: '听证',
				announcement: '公告'
			},
			narrativeStatus: {
				viral: '病毒式',
				spreading: '扩散中',
				emerging: '新兴',
				crossing: '跨界'
			},
			narrativeSeverity: {
				high: '高',
				medium: '中',
				low: '低'
			},
			correlationLevel: {
				high: '高',
				elevated: '升高',
				emerging: '新兴',
				surging: '飙升',
				rising: '上升'
			}
		},
		empty: {
			default: '暂无数据',
			news: '暂无新闻',
			markets: '暂无市场数据',
			mainChar: '暂无数据',
			correlation: '数据不足，无法分析',
			narrative: '数据不足，无法进行叙事分析',
			contracts: '暂无合同数据',
			layoffs: '暂无近期裁员数据',
			polymarket: '暂无预测数据',
			fed: '暂无美联储新闻',
			leaders: '暂无领导人数据',
			intel: '暂无情报源',
			blockbeats: '暂无快讯',
			heatmap: '暂无板块数据',
			crypto: '暂无加密货币数据',
			commodities: '暂无大宗商品数据',
			monitors: '暂无监控配置',
			printer: '暂无美联储数据',
			situation: '暂无相关新闻',
			insufficientData: '数据不足',
			noPatterns: '未检测到显著模式',
			noNarratives: '未检测到显著叙事',
			aiInsights: '请先在设置中启用要分析的模块'
		},
		situation: {
			venezuela: { title: '委内瑞拉局势', subtitle: '人道危机与政局' },
			greenland: { title: '格陵兰局势', subtitle: '北极地缘' },
			iran: {
				title: '伊朗局势',
				subtitle: '抗议、政局与核计划'
			}
		},
		panels: {
			globalSituation: '全球态势',
			fedBalance: '美联储资产负债表',
			mainCharLabel: '今日主角',
			mainCharMentions: '次出现在标题中',
			panelsCount: '个面板',
			closePanel: '关闭面板',
			togglePanel: '展开/收起面板',
			pinPanel: '置顶',
			unpinPanel: '取消置顶',
			activeCount: '启用'
		},
		contracts: {
			billion: '亿',
			million: '百万',
			thousand: '千'
		},
		correlation: {
			emergingPatterns: '新出现的模式',
			momentumSignals: '动量信号',
			crossSourceLinks: '跨来源关联',
			predictiveSignals: '预测信号',
			items: '{n} 条',
			sources: '{n} 个来源',
			confidence: '置信度'
		},
		narrative: { mentions: '次提及' },
		map: {
			zoomIn: '放大',
			zoomOut: '缩小',
			reset: '重置',
			legendHigh: '高',
			legendElevated: '升高',
			legendLow: '低'
		},
		mapPlaces: {
			oceans: {
				ATLANTIC: '大西洋',
				PACIFIC: '太平洋',
				INDIAN: '印度洋',
				ARCTIC: '北冰洋',
				SOUTHERN: '南大洋'
			},
			chokepoints: {
				Suez: '苏伊士',
				Panama: '巴拿马',
				Hormuz: '霍尔木兹',
				Malacca: '马六甲',
				'Bab el-M': '曼德海峡',
				Gibraltar: '直布罗陀',
				Bosporus: '博斯普鲁斯'
			},
			hotspots: {
				DC: '华盛顿',
				Moscow: '莫斯科',
				Beijing: '北京',
				Kyiv: '基辅',
				Taipei: '台北',
				Tehran: '德黑兰',
				'Tel Aviv': '特拉维夫',
				London: '伦敦',
				Brussels: '布鲁塞尔',
				Pyongyang: '平壤',
				Riyadh: '利雅得',
				Delhi: '德里',
				Singapore: '新加坡',
				Tokyo: '东京',
				Caracas: '加拉加斯',
				Nuuk: '努克'
			}
		},
		monitors: {
			createMonitor: '新建监控',
			disable: '禁用',
			enable: '启用',
			edit: '编辑',
			delete: '删除'
		},
		fed: { noApiKey: '配置 VITE_FRED_API_KEY 后可显示经济指标' },
		crypto: {
			addCoin: '添加币种',
			addCoinModalTitle: '添加币种',
			remove: '移除',
			maxReached: '最多添加 20 个币种',
			searchPlaceholder: '搜索名称或代号',
			searchStockPlaceholder: '输入币种名称或代码搜索…',
			noMatch: '无匹配',
			allAdded: '已全部添加',
			presetLabel: '常用币种',
			searchLabel: '搜索币种',
			searching: '搜索中…'
		},
		whale: {
			addAddress: '添加地址',
			addAddressModalTitle: '添加巨鲸地址',
			addressPlaceholder: '粘贴钱包地址，如 0x... 或 bc1...',
			invalidAddress: '地址格式无效或过短',
			maxReached: '最多 30 个地址',
			watchedAddresses: '监控的地址',
			remove: '移除',
			emptyHint: '添加要监控的巨鲸钱包地址，将显示其大额转账',
			emptyTx: '暂无该地址的转账记录',
			confirmAdd: '添加',
			balanceSection: '余额',
			transactionsSection: '交易',
			emptyBalance: '暂无余额',
			productionHint:
				'生产环境请在部署平台设置 VITE_ETHERSCAN_API_KEY（如 Vercel），以显示真实链上数据。'
		},
		status: {
			highFear: '高恐慌',
			elevated: '升高',
			low: '低',
			critical: '严重',
			monitoring: '监控中'
		},
		commodities: {
			'^VIX': 'VIX',
			'GC=F': '黄金',
			'CL=F': '原油',
			'NG=F': '天然气',
			'SI=F': '白银',
			'HG=F': '铜',
			'PL=F': '铂金',
			'PA=F': '钯金',
			'ZW=F': '小麦',
			'ZC=F': '玉米',
			'SB=F': '糖'
		},
		commodityPicker: {
			addCommodity: '添加大宗',
			addCommodityModalTitle: '添加大宗品种',
			remove: '移除',
			maxReached: '最多 15 个品种',
			searchPlaceholder: '搜索名称或代号',
			searchStockPlaceholder: '输入大宗名称或代码搜索…',
			noMatch: '无匹配',
			allAdded: '已全部添加',
			presetLabel: '常用大宗品种',
			searchLabel: '搜索大宗',
			searching: '搜索中…'
		},
		marketPicker: {
			addMore: '添加更多',
			modalTitle: '添加指数 / 股票',
			remove: '移除',
			maxReached: '最多 25 个',
			searchPlaceholder: '从下方选择或搜索股票代码',
			searchStockPlaceholder: '输入股票代码或名称搜索…',
			noMatch: '无匹配',
			allAdded: '已全部添加',
			presetLabel: '常用指数与股票',
			searchLabel: '搜索股票',
			searching: '搜索中…'
		}
	},
	en: {
		header: {
			logo: 'SITUATION MONITOR',
			refreshing: 'Refreshing...',
			lastUpdated: 'Last updated: ',
			neverRefreshed: 'Never refreshed',
			settings: 'Settings'
		},
		modal: { close: 'Close' },
		settings: {
			title: 'Settings',
			dashboard: 'Dashboard',
			language: 'Language',
			background: 'Background',
			themeDark: 'Dark',
			themeLight: 'Light',
			enabledPanels: 'Enabled Panels',
			sectionDesc: 'Toggle panels on/off to customize your dashboard',
			reconfigure: 'Reconfigure Dashboard',
			btnHint: 'Choose a preset profile for your panels',
			reset: 'Reset All Settings',
			autoRefresh: 'Auto-refresh',
			autoRefreshInterval: 'Refresh interval',
			interval1m: '1 min',
			interval5m: '5 min',
			interval15m: '15 min',
			interval30m: '30 min',
			interval1h: '1 hour',
			customInterval: 'Custom',
			customMinutes: 'minutes'
		},
		onboarding: {
			welcome: 'Welcome to Situation Monitor',
			subtitle: 'Choose a dashboard configuration to get started',
			skip: 'Skip onboarding',
			hint: 'You can change this later in Settings',
			panelsCount: ' panels'
		},
		monitorForm: {
			editMonitor: 'Edit Monitor',
			createMonitor: 'Create Monitor',
			name: 'Name',
			keywords: 'Keywords (comma separated)',
			placeholderName: 'e.g., Ukraine Crisis',
			placeholderKeywords: 'e.g., ukraine, zelensky, kyiv',
			formHint: 'News matching any of these keywords will appear in your monitor',
			enabled: 'Enabled',
			delete: 'Delete',
			cancel: 'Cancel',
			saveChanges: 'Save Changes',
			create: 'Create Monitor',
			nameRequired: 'Name is required',
			keywordRequired: 'At least one keyword is required',
			maxMonitors: 'Maximum number of monitors reached (20)'
		},
		aiSettings: {
			title: 'AI Summary API Settings',
			provider: 'Provider',
			apiKey: 'API Key',
			apiKeyPlaceholder: 'sk-xxx (stored locally only)',
			model: 'Model',
			modelOptional: 'Optional, leave blank for default',
			save: 'Save',
			cancel: 'Cancel',
			hint: 'Supports DeepSeek, ChatGPT (OpenAI), etc. Enter the corresponding API Key to generate summaries.'
		},
		aiInsights: {
			settingsLabel: 'AI API Settings',
			statsEnabledPanels: '{n} panels enabled',
			statsMessages: '{n} messages',
			statsAlerts: '{n} alerts',
			summaryTitle: 'Summary',
			aiSummaryTitle: 'AI Summary',
			generating: 'Generating…',
			retry: 'Retry',
			regenerate: 'Regenerate',
			generate: 'Generate summary',
			placeholderNeedData: 'Enable panels to analyze and wait for data.',
			placeholderNeedKey:
				'Click the settings button to add an API key (DeepSeek, ChatGPT, etc.), or set VITE_AI_API_KEY in .env.',
			requestFailed:
				'Request failed (possibly CORS). Use a local proxy or server-side forwarding, or run npm run dev to use the SvelteKit proxy.'
		},
		common: {
			retry: 'Retry',
			loading: 'Loading…',
			empty: 'No data',
			openInNewTab: 'Open in new tab',
			showMore: 'Show more',
			showLess: 'Show less',
			moreItems: '{n} more'
		},
		tags: {
			alert: 'ALERT',
			powell: 'POWELL',
			video: 'VIDEO',
			intelSourceType: {
				osint: 'OSINT',
				govt: 'GOVT',
				cyber: 'CYBER',
				defense: 'DEFENSE',
				regional: 'REGIONAL',
				'think-tank': 'THINK TANK'
			},
			intelRegion: {
				EUROPE: 'Europe',
				MENA: 'MENA',
				APAC: 'APAC',
				AMERICAS: 'Americas',
				AFRICA: 'Africa'
			},
			intelTopic: {
				CYBER: 'Cyber',
				NUCLEAR: 'Nuclear',
				CONFLICT: 'Conflict',
				INTEL: 'Intel',
				DEFENSE: 'Defense',
				DIPLO: 'Diplomacy'
			},
			fedType: {
				monetary: 'Monetary Policy',
				powell: 'Chair Powell',
				speech: 'Speeches',
				testimony: 'Testimony',
				announcement: 'Announcements'
			},
			narrativeStatus: {
				viral: 'VIRAL',
				spreading: 'SPREADING',
				emerging: 'EMERGING',
				crossing: 'CROSSING'
			},
			narrativeSeverity: {
				high: 'HIGH',
				medium: 'MEDIUM',
				low: 'LOW'
			},
			correlationLevel: {
				high: 'HIGH',
				elevated: 'ELEVATED',
				emerging: 'EMERGING',
				surging: 'SURGING',
				rising: 'RISING'
			}
		},
		empty: {
			default: 'No data',
			news: 'No news available',
			markets: 'No market data available',
			mainChar: 'No data yet',
			correlation: 'Insufficient data for analysis',
			narrative: 'Insufficient data for narrative analysis',
			contracts: 'No contracts available',
			layoffs: 'No recent layoffs data',
			polymarket: 'No predictions available',
			fed: 'No Fed news available',
			leaders: 'No leaders data available',
			intel: 'No intel available',
			blockbeats: 'No flash news',
			heatmap: 'No sector data available',
			crypto: 'No crypto data available',
			commodities: 'No commodity data available',
			monitors: 'No monitors configured',
			printer: 'No Fed data available',
			situation: 'No recent news',
			insufficientData: 'Insufficient data',
			noPatterns: 'No significant patterns detected',
			noNarratives: 'No significant narratives detected',
			aiInsights: 'Enable panels in settings to analyze'
		},
		situation: {
			venezuela: { title: 'Venezuela Watch', subtitle: 'Humanitarian crisis monitoring' },
			greenland: { title: 'Greenland Watch', subtitle: 'Arctic geopolitics monitoring' },
			iran: {
				title: 'Iran Crisis',
				subtitle: 'Revolution protests, regime instability & nuclear program'
			}
		},
		panels: {
			globalSituation: 'Global Situation',
			fedBalance: 'Federal Reserve Balance Sheet',
			mainCharLabel: "Today's Main Character",
			mainCharMentions: 'mentions in headlines',
			panelsCount: ' panels',
			closePanel: 'Close panel',
			togglePanel: 'Toggle panel',
			pinPanel: 'Pin to top',
			unpinPanel: 'Unpin',
			activeCount: 'active'
		},
		contracts: {
			billion: 'B',
			million: 'M',
			thousand: 'K'
		},
		correlation: {
			emergingPatterns: 'Emerging Patterns',
			momentumSignals: 'Momentum Signals',
			crossSourceLinks: 'Cross-Source Links',
			predictiveSignals: 'Predictive Signals',
			items: '{n} items',
			sources: '{n} sources',
			confidence: 'Confidence'
		},
		narrative: { mentions: 'mentions' },
		map: {
			zoomIn: 'Zoom in',
			zoomOut: 'Zoom out',
			reset: 'Reset',
			legendHigh: 'High',
			legendElevated: 'Elevated',
			legendLow: 'Low'
		},
		mapPlaces: {
			oceans: {
				ATLANTIC: 'Atlantic',
				PACIFIC: 'Pacific',
				INDIAN: 'Indian',
				ARCTIC: 'Arctic',
				SOUTHERN: 'Southern'
			},
			chokepoints: {
				Suez: 'Suez',
				Panama: 'Panama',
				Hormuz: 'Hormuz',
				Malacca: 'Malacca',
				'Bab el-M': 'Bab el-Mandeb',
				Gibraltar: 'Gibraltar',
				Bosporus: 'Bosporus'
			},
			hotspots: {
				DC: 'DC',
				Moscow: 'Moscow',
				Beijing: 'Beijing',
				Kyiv: 'Kyiv',
				Taipei: 'Taipei',
				Tehran: 'Tehran',
				'Tel Aviv': 'Tel Aviv',
				London: 'London',
				Brussels: 'Brussels',
				Pyongyang: 'Pyongyang',
				Riyadh: 'Riyadh',
				Delhi: 'Delhi',
				Singapore: 'Singapore',
				Tokyo: 'Tokyo',
				Caracas: 'Caracas',
				Nuuk: 'Nuuk'
			}
		},
		monitors: {
			createMonitor: 'Create Monitor',
			disable: 'Disable',
			enable: 'Enable',
			edit: 'Edit',
			delete: 'Delete'
		},
		fed: { noApiKey: 'Add VITE_FRED_API_KEY for economic indicators' },
		crypto: {
			addCoin: 'Add coin',
			addCoinModalTitle: 'Add coin',
			remove: 'Remove',
			maxReached: 'Max 20 coins',
			searchPlaceholder: 'Search name or symbol',
			searchStockPlaceholder: 'Search coin by symbol or name…',
			noMatch: 'No match',
			allAdded: 'All added',
			presetLabel: 'Common coins',
			searchLabel: 'Search coin',
			searching: 'Searching…'
		},
		whale: {
			addAddress: 'Add address',
			addAddressModalTitle: 'Add whale address',
			addressPlaceholder: 'Paste wallet address, e.g. 0x... or bc1...',
			invalidAddress: 'Invalid or too short address',
			maxReached: 'Max 30 addresses',
			watchedAddresses: 'Watched addresses',
			remove: 'Remove',
			emptyHint: 'Add whale wallet addresses to monitor their large transfers',
			emptyTx: 'No transactions for these addresses yet',
			confirmAdd: 'Add',
			balanceSection: 'Balance',
			transactionsSection: 'Transactions',
			emptyBalance: 'No balance',
			productionHint:
				'In production, set VITE_ETHERSCAN_API_KEY in your build platform (e.g. Vercel) to show real chain data'
		},
		status: {
			highFear: 'HIGH FEAR',
			elevated: 'ELEVATED',
			low: 'LOW',
			critical: 'CRITICAL',
			monitoring: 'MONITORING'
		},
		commodities: {
			'^VIX': 'VIX',
			'GC=F': 'Gold',
			'CL=F': 'Crude Oil',
			'NG=F': 'Natural Gas',
			'SI=F': 'Silver',
			'HG=F': 'Copper',
			'PL=F': 'Platinum',
			'PA=F': 'Palladium',
			'ZW=F': 'Wheat',
			'ZC=F': 'Corn',
			'SB=F': 'Sugar'
		},
		commodityPicker: {
			addCommodity: 'Add commodity',
			addCommodityModalTitle: 'Add commodity',
			remove: 'Remove',
			maxReached: 'Max 15 commodities',
			searchPlaceholder: 'Search name or symbol',
			searchStockPlaceholder: 'Search commodity by symbol or name…',
			noMatch: 'No match',
			allAdded: 'All added',
			presetLabel: 'Common commodities',
			searchLabel: 'Search commodity',
			searching: 'Searching…'
		},
		marketPicker: {
			addMore: 'Add more',
			modalTitle: 'Add index / stock',
			remove: 'Remove',
			maxReached: 'Max 25',
			searchPlaceholder: 'Choose below or search by symbol',
			searchStockPlaceholder: 'Search by symbol or name…',
			noMatch: 'No match',
			allAdded: 'All added',
			presetLabel: 'Indices & stocks',
			searchLabel: 'Search stock',
			searching: 'Searching…'
		}
	}
};

export function getPanelName(panelId: PanelId, locale: Locale): string {
	return PANEL_NAMES[locale][panelId] ?? panelId;
}

export function getPresetText(
	presetId: string,
	locale: Locale
): { name: string; description: string; audience?: string } {
	const t = PRESET_TEXTS[locale][presetId];
	return t ?? { name: presetId, description: '' };
}

export function getSituationConfig(
	key: 'venezuela' | 'greenland' | 'iran',
	locale: Locale
): { title: string; subtitle: string } {
	return UI_TEXTS[locale].situation[key];
}

export type MapPlaceType = 'oceans' | 'chokepoints' | 'hotspots';

export function getMapPlaceName(locale: Locale, type: MapPlaceType, key: string): string {
	const places = UI_TEXTS[locale].mapPlaces[type];
	return places?.[key] ?? key;
}
