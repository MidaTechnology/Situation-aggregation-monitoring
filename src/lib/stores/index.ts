/**
 * Stores barrel file - re-exports all stores
 */

// Settings store
export {
	settings,
	enabledPanels,
	disabledPanels,
	draggablePanels,
	type PanelSettings,
	type SettingsState,
	type Theme
} from './settings';

// Monitors store
export {
	monitors,
	enabledMonitors,
	monitorCount,
	matchCount,
	hasMatches,
	type MonitorMatch,
	type MonitorMatchItem,
	type MonitorsState
} from './monitors';

// News store
export {
	news,
	politicsNews,
	techNews,
	financeNews,
	govNews,
	aiNews,
	intelNews,
	allNewsItems,
	alerts,
	isLoading as isNewsLoading,
	hasErrors as hasNewsErrors,
	type CategoryState,
	type NewsState
} from './news';

// Markets store
export {
	markets,
	indices,
	sectors,
	commodities,
	crypto,
	isMarketsLoading,
	marketsLastUpdated,
	vix,
	type MarketsState
} from './markets';

// Crypto list store (user-selected coins for crypto panel)
export { cryptoList } from './cryptoList';

// Commodity list store (user-selected commodities for commodities panel)
export { commodityList } from './commodityList';

// Indices list store (user-selected indices/stocks for markets panel)
export { indicesList } from './indicesList';

// BlockBeats store (crypto flash news)
export { blockbeats } from './blockbeats';

// Whale addresses store (user-added wallet addresses to monitor)
export { whaleAddresses } from './whaleAddresses';

// Refresh store
export {
	refresh,
	isRefreshing,
	currentStage,
	lastRefresh,
	autoRefreshEnabled,
	timeSinceRefresh,
	categoriesWithErrors,
	REFRESH_STAGES,
	type RefreshStage,
	type StageConfig,
	type RefreshState
} from './refresh';

// Fed store
export {
	fedIndicators,
	fedNews,
	isFedLoading,
	fedVideos,
	type FedIndicatorsState,
	type FedNewsState
} from './fed';

// AI settings store (AI Insights: provider, API key, model)
export { aiSettings, type AISettings } from './aiSettings';
