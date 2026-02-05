/**
 * API barrel exports
 */

export { fetchCategoryNews, fetchAllNews } from './news';
export {
	fetchCryptoPrices,
	fetchIndices,
	fetchSectorPerformance,
	fetchCommodities,
	fetchAllMarkets
} from './markets';
export { fetchPolymarket } from './polymarket';
export {
	fetchWhaleTransactions,
	fetchWhaleBalances,
	fetchGovContracts,
	fetchLayoffs
} from './misc';
export type { Prediction, WhaleTransaction, WhaleBalance, Contract, Layoff } from './misc';
export { createWalletWatchAlert, deleteWalletAlert } from './whaleAlert';
export type {
	CreateWalletAlertResponse,
	CreateWalletAlertResult,
	CreateWalletAlertError
} from './whaleAlert';
export { fetchWorldLeaders } from './leaders';
export { fetchFedIndicators, fetchFedNews, isFredConfigured } from './fred';
export type { FedIndicators, EconomicIndicator, FedNewsItem, FedNewsType } from './fred';
export { fetchBlockBeatsFlash, fetchBlockBeatsInformation, toBlockBeatsLang } from './blockbeats';
export type { BlockBeatsFlashItem, BlockBeatsArticleItem, BlockBeatsLang } from './blockbeats';
export { generateAISummary, isAIConfigured } from './ai';
export type { GenerateSummaryResult } from './ai';