/**
 * Twelve Data API - Symbol search for markets panel
 * Used for "添加更多" to search stocks/indices by symbol or name.
 *
 * API: GET https://api.twelvedata.com/symbol_search?symbol=QUERY&outputsize=30&apikey=KEY
 * Response: { data: [{ symbol, instrument_name, exchange, ... }], status: "ok" }
 */

import { TWELVE_DATA_API_KEY, TWELVE_DATA_BASE_URL, fetchWithProxy, logger } from '$lib/config/api';

export interface TwelveDataSymbolResult {
	symbol: string;
	instrument_name?: string;
	name?: string;
	exchange?: string;
	mic_code?: string;
	instrument_type?: string;
	country?: string;
	currency?: string;
}

interface TwelveDataSearchResponse {
	data?: TwelveDataSymbolResult[];
	status?: string;
	message?: string;
	code?: number;
}

const SEARCH_TIMEOUT_MS = 15_000;

/**
 * Check if Twelve Data API key is configured
 */
export function hasTwelveDataApiKey(): boolean {
	return Boolean(TWELVE_DATA_API_KEY && TWELVE_DATA_API_KEY.length > 0);
}

function timeoutPromise(ms: number): Promise<never> {
	return new Promise((_, reject) =>
		setTimeout(() => reject(new Error('Request timeout')), ms)
	);
}

/**
 * Get display name from API item (supports both instrument_name and name)
 */
function getItemName(d: TwelveDataSymbolResult): string {
	const name = d.instrument_name ?? (d as { name?: string }).name ?? d.symbol;
	return String(name ?? '').trim() || String(d.symbol ?? '');
}

/**
 * Search symbols (stocks, ETFs, indices) via Twelve Data symbol_search.
 * Tries SvelteKit server proxy first (no CORS), then falls back to CORS proxy + direct URL.
 */
async function fetchSearchResponse(q: string): Promise<Response> {
	const proxyUrl = `/api/twelve-data/symbol-search?q=${encodeURIComponent(q)}`;
	const directUrl = `${TWELVE_DATA_BASE_URL}/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=30&apikey=${TWELVE_DATA_API_KEY}`;

	const withTimeout = (p: Promise<Response>) =>
		Promise.race([p, timeoutPromise(SEARCH_TIMEOUT_MS)]);

	try {
		const res = await withTimeout(fetch(proxyUrl));
		if (res.ok) return res;
	} catch {
		// Proxy unavailable (e.g. static build) or timeout
	}
	return withTimeout(fetchWithProxy(directUrl));
}

/**
 * Search symbols (stocks, ETFs, indices) via Twelve Data symbol_search.
 * Returns list of { symbol, name } for display and adding to market list.
 */
export async function searchSymbols(
	query: string
): Promise<{ symbol: string; name: string; exchange?: string; instrument_type?: string; country?: string }[]> {
	if (!query || query.trim().length < 2) {
		return [];
	}
	if (!hasTwelveDataApiKey()) {
		logger.warn('Twelve Data', 'API key not set. Add VITE_TWELVE_DATA_API_KEY (or VITE_TWLEVE_DATA_API_KEY) to .env');
		return [];
	}
	const q = query.trim();
	try {
		const response = await fetchSearchResponse(q);
		if (response.status === 401 || response.status === 403) {
			logger.warn('Twelve Data', 'API key invalid or forbidden. Check VITE_TWELVE_DATA_API_KEY in .env');
			return [];
		}
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const raw = await response.json();
		if ((raw as { error?: string }).error) {
			logger.warn('Twelve Data', (raw as { error: string }).error);
			return [];
		}
		const data = raw as TwelveDataSearchResponse;
		if (data.status === 'error') {
			logger.warn('Twelve Data', 'API error:', (data as { message?: string }).message ?? raw);
			return [];
		}
		// Support { data: [...] }, direct array, or proxy-wrapped { data: { data: [...] } }
		let list: TwelveDataSymbolResult[] = [];
		if (Array.isArray(data.data)) {
			list = data.data;
		} else if (Array.isArray(raw)) {
			list = raw as TwelveDataSymbolResult[];
		} else if (Array.isArray((raw as { data?: unknown }).data)) {
			list = (raw as { data: TwelveDataSymbolResult[] }).data;
		} else if (
			raw &&
			typeof raw === 'object' &&
			(raw as { data?: unknown }).data &&
			typeof (raw as { data: unknown }).data === 'object' &&
			Array.isArray((raw as { data: { data?: unknown } }).data?.data)
		) {
			list = (raw as { data: { data: TwelveDataSymbolResult[] } }).data.data;
		} else {
			logger.warn('Twelve Data', 'Unexpected response shape:', typeof data.data, raw);
		}
		return list
			.map((d) => ({
				symbol: String(d.symbol ?? '').trim(),
				name: getItemName(d),
				exchange: d.exchange ? String(d.exchange).trim() : undefined,
				instrument_type: d.instrument_type ? String(d.instrument_type).trim() : undefined,
				country: d.country ? String(d.country).trim() : undefined
			}))
			.filter((r) => r.symbol.length > 0);
	} catch (error) {
		logger.error('Twelve Data', 'Symbol search failed:', error);
		return [];
	}
}
