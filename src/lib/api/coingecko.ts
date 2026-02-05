/**
 * CoinGecko API - Coins list for crypto panel search
 * GET /coins/list returns { id, symbol, name }[] (no API key required)
 */

const COINS_LIST_URL = 'https://api.coingecko.com/api/v3/coins/list';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cachedList: { id: string; symbol: string; name: string }[] | null = null;
let cacheTime = 0;

export type CoinSearchResult = { id: string; symbol: string; name: string };

async function fetchCoinsList(): Promise<CoinSearchResult[]> {
	if (cachedList && Date.now() - cacheTime < CACHE_TTL_MS) {
		return cachedList;
	}
	const res = await fetch(COINS_LIST_URL);
	if (!res.ok) throw new Error(`CoinGecko list ${res.status}`);
	const raw = (await res.json()) as unknown;
	if (!Array.isArray(raw)) return [];
	cachedList = raw
		.filter(
			(item): item is { id: string; symbol: string; name: string } =>
				typeof item === 'object' &&
				item !== null &&
				typeof (item as { id?: string }).id === 'string' &&
				typeof (item as { symbol?: string }).symbol === 'string' &&
				typeof (item as { name?: string }).name === 'string'
		)
		.map((item) => ({
			id: String(item.id).trim(),
			symbol: String(item.symbol).trim(),
			name: String(item.name).trim()
		}))
		.filter((r) => r.id.length > 0);
	cacheTime = Date.now();
	return cachedList;
}

/**
 * Search CoinGecko coins by id, symbol, or name (case-insensitive).
 * Returns up to 30 matches. Uses cached coins list.
 */
export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
	const q = query.trim();
	if (q.length < 2) return [];
	const list = await fetchCoinsList();
	const lower = q.toLowerCase();
	const seen = new Set<string>();
	const results: CoinSearchResult[] = [];
	for (const coin of list) {
		if (
			coin.id.toLowerCase().includes(lower) ||
			coin.symbol.toLowerCase().includes(lower) ||
			coin.name.toLowerCase().includes(lower)
		) {
			if (seen.has(coin.id)) continue;
			seen.add(coin.id);
			results.push(coin);
			if (results.length >= 30) break;
		}
	}
	return results;
}
