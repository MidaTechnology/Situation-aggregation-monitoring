/**
 * Markets API - Fetch market data from Finnhub
 *
 * Get your free API key at: https://finnhub.io/
 * Free tier: 60 calls/minute
 */

import {
	INDICES,
	SECTORS,
	COMMODITIES,
	CRYPTO,
	type CryptoOption,
	type CommodityConfig,
	type IndexConfig
} from '$lib/config/markets';
import type { MarketItem, SectorPerformance, CryptoItem } from '$lib/types';
import { fetchWithProxy, logger, FINNHUB_API_KEY, FINNHUB_BASE_URL } from '$lib/config/api';

interface CoinGeckoPrice {
	usd: number;
	usd_24h_change?: number;
}

interface CoinGeckoPricesResponse {
	[key: string]: CoinGeckoPrice;
}

interface FinnhubQuote {
	c: number; // Current price
	d: number; // Change
	dp: number; // Percent change
	h: number; // High price of the day
	l: number; // Low price of the day
	o: number; // Open price of the day
	pc: number; // Previous close price
	t: number; // Timestamp
}

/**
 * Check if Finnhub API key is configured
 */
function hasFinnhubApiKey(): boolean {
	return Boolean(FINNHUB_API_KEY && FINNHUB_API_KEY.length > 0);
}

/**
 * Create an empty market item (used for error/missing data states)
 */
function createEmptyMarketItem<T extends 'index' | 'commodity'>(
	symbol: string,
	name: string,
	type: T
): MarketItem {
	return { symbol, name, price: NaN, change: NaN, changePercent: NaN, type };
}

/**
 * Create an empty sector performance item
 */
function createEmptySectorItem(symbol: string, name: string): SectorPerformance {
	return { symbol, name, price: NaN, change: NaN, changePercent: NaN };
}

// Map index symbols to ETF proxies (free tier doesn't support direct indices)
const INDEX_ETF_MAP: Record<string, string> = {
	'^DJI': 'DIA', // Dow Jones -> SPDR Dow Jones ETF
	'^GSPC': 'SPY', // S&P 500 -> SPDR S&P 500 ETF
	'^IXIC': 'QQQ', // NASDAQ -> Invesco QQQ (NASDAQ-100)
	'^RUT': 'IWM' // Russell 2000 -> iShares Russell 2000 ETF
};

/**
 * Fetch a quote from Finnhub.
 * Uses CORS proxy in browser so Finnhub responses are not blocked.
 */
async function fetchFinnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
	try {
		const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
		const response = await fetchWithProxy(url);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data: FinnhubQuote = await response.json();

		// Finnhub returns all zeros when symbol not found
		if (data.c === 0 && data.pc === 0) {
			return null;
		}

		return data;
	} catch (error) {
		logger.error('Markets API', `Error fetching quote for ${symbol}:`, error);
		return null;
	}
}

type EastmoneyQuote = {
	price: number;
	change: number;
	pct: number;
	high: number;
	low: number;
	open: number;
	prevClose: number;
};

/**
 * Fetch quote from Eastmoney (no API key, used for China A-shares fallback).
 * Returns price data in normal decimals (CNY), not fen.
 * Tries server proxy (/api/eastmoney) first, then api.allorigins.win for static deploy.
 */
async function fetchEastmoneyQuote(symbol: string): Promise<EastmoneyQuote | null> {
	// Accept raw 6-digit, or suffix .SS/.SZ
	const raw = symbol.replace(/\.SS$/i, '').replace(/\.SZ$/i, '').trim();
	if (!/^\d{6}$/.test(raw)) return null;
	const market = raw.startsWith('6') ? '1' : raw.startsWith('0') || raw.startsWith('3') ? '0' : null;
	if (!market) return null;

	const secid = `${market}.${raw}`;
	const target = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f169,f170,f44,f45,f46,f47,f48,f58,f60`;

	const parseEastmoneyResponse = (data: unknown): EastmoneyQuote | null => {
		const obj = data as {
			data?: {
				f43?: number;
				f169?: number;
				f170?: number;
				f44?: number;
				f45?: number;
				f46?: number;
				f60?: number;
			};
		};
		const d = obj?.data;
		if (!d || typeof d.f43 !== 'number') return null;
		const toPrice = (v?: number) => (typeof v === 'number' ? v / 100 : NaN);
		return {
			price: toPrice(d.f43),
			change: toPrice(d.f169),
			pct: toPrice(d.f170),
			high: toPrice(d.f44),
			low: toPrice(d.f45),
			open: toPrice(d.f46),
			prevClose: toPrice(d.f60)
		};
	};

	// 1. Prefer our API route (works in dev and on Vercel; avoids 403 from Eastmoney)
	try {
		const res = await fetch(`/api/eastmoney?secid=${encodeURIComponent(secid)}`);
		if (res.ok) {
			const data = await res.json();
			const parsed = parseEastmoneyResponse(data);
			if (parsed) return parsed;
		}
	} catch {
		// Fall through to public proxy
	}

	// 2. Fallback for static deploy: api.allorigins.win (corsproxy.io often returns 403 for Eastmoney)
	try {
		const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
		const res = await fetch(proxyUrl);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		return parseEastmoneyResponse(data);
	} catch (error) {
		logger.warn('Markets API', 'Eastmoney quote failed', symbol, error);
		return null;
	}
}

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

/**
 * Fetch crypto prices from CoinGecko.
 * Tries direct fetch first (CoinGecko allows CORS); falls back to proxy if needed.
 * @param coins - List of { id, symbol, name } (CoinGecko id). If not provided, uses CRYPTO from config.
 */
export async function fetchCryptoPrices(coins?: CryptoOption[]): Promise<CryptoItem[]> {
	const list = coins && coins.length > 0 ? coins : CRYPTO;
	const ids = list.map((c) => c.id).join(',');
	const coinGeckoUrl = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

	function mapResponse(data: CoinGeckoPricesResponse): CryptoItem[] {
		return list.map((crypto) => {
			const priceData = data[crypto.id];
			const usd = priceData?.usd;
			const change = priceData?.usd_24h_change;
			return {
				id: crypto.id,
				symbol: crypto.symbol,
				name: crypto.name,
				current_price: typeof usd === 'number' ? usd : 0,
				price_change_24h: typeof change === 'number' ? change : 0,
				price_change_percentage_24h: typeof change === 'number' ? change : 0
			};
		});
	}

	// 1. Try direct fetch (CoinGecko allows CORS for simple/price)
	try {
		logger.log('Markets API', 'Fetching crypto from CoinGecko (direct)');
		const direct = await fetch(coinGeckoUrl);
		if (direct.ok) {
			const data = (await direct.json()) as CoinGeckoPricesResponse;
			if (
				data &&
				typeof data === 'object' &&
				(data.bitcoin || data.ethereum || Object.keys(data).length > 0)
			) {
				return mapResponse(data);
			}
		}
	} catch (e) {
		logger.warn('Markets API', 'CoinGecko direct fetch failed, trying proxy:', e);
	}

	// 2. Fallback: proxy
	try {
		logger.log('Markets API', 'Fetching crypto from CoinGecko (proxy)');
		const response = await fetchWithProxy(coinGeckoUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const data = (await response.json()) as CoinGeckoPricesResponse;
		if (data && typeof data === 'object') {
			return mapResponse(data);
		}
	} catch (error) {
		logger.error('Markets API', 'Error fetching crypto:', error);
	}

	return list.map((c) => ({
		id: c.id,
		symbol: c.symbol,
		name: c.name,
		current_price: 0,
		price_change_24h: 0,
		price_change_percentage_24h: 0
	}));
}

/**
 * Fetch market indices from Finnhub.
 * @param indicesConfig - List from indicesList.getSelectedConfig(). If omitted, uses INDICES default.
 */
export async function fetchIndices(indicesConfig?: IndexConfig[]): Promise<MarketItem[]> {
	const list = indicesConfig && indicesConfig.length > 0 ? indicesConfig : INDICES;
	const createEmptyIndices = () =>
		list.map((i) => createEmptyMarketItem(i.symbol, i.name, 'index'));

	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured. Add VITE_FINNHUB_API_KEY to .env');
		return createEmptyIndices();
	}

	try {
		logger.log('Markets API', 'Fetching indices from Finnhub');

		const resolveSymbol = (index: IndexConfig) => {
			const baseSymbol = INDEX_ETF_MAP[index.symbol] || index.symbol;
			// China A-share mapping: 6xxxxx -> SSE (.SS), 0/3xxxxx -> SZ (.SZ)
			if (/^\d{6}$/.test(baseSymbol)) {
				if (baseSymbol.startsWith('6')) return `${baseSymbol}.SS`;
				if (baseSymbol.startsWith('0') || baseSymbol.startsWith('3')) return `${baseSymbol}.SZ`;
			}
			return baseSymbol;
		};

		const isChinaASymbol = (symbol: string) => {
			const raw = symbol.replace(/\.SS$/i, '').replace(/\.SZ$/i, '');
			return /^\d{6}$/.test(raw);
		};

		const items = await Promise.all(
			list.map(async (index) => {
				const fetchSymbol = resolveSymbol(index);
				const isChinaA = isChinaASymbol(fetchSymbol);

				// Prefer Eastmoney for China A to avoid Finnhub free-tier limitations
				if (isChinaA) {
					const cnQuote = await fetchEastmoneyQuote(fetchSymbol);
					if (cnQuote) {
						return {
							symbol: index.symbol,
							name: index.name,
							price: cnQuote.price,
							change: cnQuote.change,
							changePercent: cnQuote.pct,
							type: 'index' as const
						};
					}
				}

				const quote = await fetchFinnhubQuote(fetchSymbol);
				return {
					symbol: index.symbol,
					name: index.name,
					price: quote?.c ?? NaN,
					change: quote?.d ?? NaN,
					changePercent: quote?.dp ?? NaN,
					type: 'index' as const
				};
			})
		);

		return items;
	} catch (error) {
		logger.error('Markets API', 'Error fetching indices:', error);
		return createEmptyIndices();
	}
}

/**
 * Fetch sector performance from Finnhub (using sector ETFs)
 */
export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
	const createEmptySectors = () => SECTORS.map((s) => createEmptySectorItem(s.symbol, s.name));

	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured');
		return createEmptySectors();
	}

	try {
		logger.log('Markets API', 'Fetching sector performance from Finnhub');

		const quotes = await Promise.all(
			SECTORS.map(async (sector) => {
				const quote = await fetchFinnhubQuote(sector.symbol);
				return { sector, quote };
			})
		);

		return quotes.map(({ sector, quote }) => ({
			symbol: sector.symbol,
			name: sector.name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching sectors:', error);
		return createEmptySectors();
	}
}

// Finnhub commodity ETF proxies (free tier doesn't support direct commodities)
const COMMODITY_SYMBOL_MAP: Record<string, string> = {
	'^VIX': 'VIXY', // VIX -> ProShares VIX Short-Term Futures ETF
	'GC=F': 'GLD', // Gold -> SPDR Gold Shares
	'CL=F': 'USO', // Crude Oil -> United States Oil Fund
	'NG=F': 'UNG', // Natural Gas -> United States Natural Gas Fund
	'SI=F': 'SLV', // Silver -> iShares Silver Trust
	'HG=F': 'CPER', // Copper -> United States Copper Index Fund
	'PL=F': 'PPLT', // Platinum -> Aberdeen Physical Platinum
	'PA=F': 'PALL', // Palladium -> Aberdeen Physical Palladium
	'ZW=F': 'WEAT', // Wheat -> Teucrium Wheat
	'ZC=F': 'CORN', // Corn -> Teucrium Corn
	'SB=F': 'CANE' // Sugar -> Teucrium Sugar
};

/**
 * Fetch commodities from Finnhub.
 * @param commodityConfigs - List to fetch (from commodityList.getSelectedConfig()). If omitted, uses COMMODITIES default.
 */
export async function fetchCommodities(
	commodityConfigs?: CommodityConfig[]
): Promise<MarketItem[]> {
	const list = commodityConfigs && commodityConfigs.length > 0 ? commodityConfigs : COMMODITIES;
	const createEmptyCommodities = () =>
		list.map((c) => createEmptyMarketItem(c.symbol, c.name, 'commodity'));

	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured');
		return createEmptyCommodities();
	}

	try {
		logger.log('Markets API', 'Fetching commodities from Finnhub');

		const results = await Promise.allSettled(
			list.map(async (commodity) => {
				const finnhubSymbol = COMMODITY_SYMBOL_MAP[commodity.symbol] || commodity.symbol;
				const quote = await fetchFinnhubQuote(finnhubSymbol);
				return { commodity, quote };
			})
		);

		return results.map((result, i) => {
			const commodity = list[i];
			if (result.status === 'rejected') {
				logger.warn('Markets API', `Commodity ${commodity.symbol} failed:`, result.reason);
				return createEmptyMarketItem(commodity.symbol, commodity.name, 'commodity');
			}
			const { quote } = result.value;
			return {
				symbol: commodity.symbol,
				name: commodity.name,
				price: quote?.c ?? NaN,
				change: quote?.d ?? NaN,
				changePercent: quote?.dp ?? NaN,
				type: 'commodity' as const
			};
		});
	} catch (error) {
		logger.error('Markets API', 'Error fetching commodities:', error);
		return createEmptyCommodities();
	}
}

interface AllMarketsData {
	crypto: CryptoItem[];
	indices: MarketItem[];
	sectors: SectorPerformance[];
	commodities: MarketItem[];
}

/**
 * Fetch all market data.
 * @param cryptoCoins - Optional list of coins for crypto panel (from cryptoList.getSelectedConfig()). If omitted, uses config default.
 * @param commodityConfigs - Optional list of commodities (from commodityList.getSelectedConfig()). If omitted, uses config default.
 */
export async function fetchAllMarkets(
	cryptoCoins?: CryptoOption[],
	commodityConfigs?: CommodityConfig[],
	indicesConfig?: IndexConfig[]
): Promise<AllMarketsData> {
	const [crypto, indices, sectors, commodities] = await Promise.all([
		fetchCryptoPrices(cryptoCoins),
		fetchIndices(indicesConfig),
		fetchSectorPerformance(),
		fetchCommodities(commodityConfigs)
	]);

	return { crypto, indices, sectors, commodities };
}
