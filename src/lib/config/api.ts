/**
 * API Configuration
 */

import { browser } from '$app/environment';

/**
 * Finnhub API key
 * Get your free key at: https://finnhub.io/
 * Free tier: 60 calls/minute
 */
export const FINNHUB_API_KEY = browser
	? (import.meta.env?.VITE_FINNHUB_API_KEY ?? '')
	: (process.env.VITE_FINNHUB_API_KEY ?? '');

export const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/**
 * FRED API key (St. Louis Fed)
 * Get your free key at: https://fred.stlouisfed.org/docs/api/api_key.html
 * Free tier: Unlimited requests
 */
export const FRED_API_KEY = browser
	? (import.meta.env?.VITE_FRED_API_KEY ?? '')
	: (process.env.VITE_FRED_API_KEY ?? '');

export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

/**
 * Intellizence API key (optional) for real-time layoffs data
 * Get key at: https://www.intellizence.com/ (Dataset API / Layoffs)
 * When set, layoffs panel uses recent/real-time data instead of historical CSV
 */
export const INTELLIZENCE_API_KEY = browser
	? (import.meta.env?.VITE_INTELLIZENCE_API_KEY ?? '')
	: (process.env.VITE_INTELLIZENCE_API_KEY ?? '');

export const INTELLIZENCE_LAYOFF_URL = 'https://api.intellizence.com/api/v2/dataset/layoff';

/**
 * Airtable API key (optional) for layoffs.fyi Tech Layoffs table
 * When set, layoffs panel fetches directly from the same Airtable base that powers https://layoffs.fyi/ (Tech Layoffs tab).
 * You need a read-only key for base app1PaujS9zxVGUZ4 (request from layoffs.fyi / Roger Lee if they offer it).
 */
export const AIRTABLE_LAYOFFS_API_KEY = browser
	? (import.meta.env?.VITE_AIRTABLE_LAYOFFS_API_KEY ?? '')
	: (process.env.VITE_AIRTABLE_LAYOFFS_API_KEY ?? '');

/** layoffs.fyi Tech Layoffs table: base and table IDs from their public embed */
export const AIRTABLE_LAYOFFS_BASE_ID = 'app1PaujS9zxVGUZ4';
export const AIRTABLE_LAYOFFS_TABLE_ID = 'tbl8c8kanuNB6bPYr';
export const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

/**
 * Etherscan API key (optional) for whale panel – ETH address transactions and balance
 * Get free key at: https://etherscan.io/apis
 * When set, whale panel uses real chain data for 0x… addresses; otherwise mock data
 */
export const ETHERSCAN_API_KEY = browser
	? (import.meta.env?.VITE_ETHERSCAN_API_KEY ?? '')
	: (process.env.VITE_ETHERSCAN_API_KEY ?? '');

export const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api';

/**
 * AI API key (optional) for AI Insights panel – DeepSeek chat completions
 * Set VITE_AI_API_KEY in .env to enable "生成总结" in AI 分析 panel
 */
export const AI_API_KEY = browser
	? (import.meta.env?.VITE_AI_API_KEY ?? '')
	: (process.env.VITE_AI_API_KEY ?? '');

export const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';

/**
 * Twelve Data API key (optional) for symbol search and optional quote fallback
 * Supports both VITE_TWELVE_DATA_API_KEY and common typo VITE_TWLEVE_DATA_API_KEY
 */
export const TWELVE_DATA_API_KEY = browser
	? (import.meta.env?.VITE_TWELVE_DATA_API_KEY ?? import.meta.env?.VITE_TWLEVE_DATA_API_KEY ?? '')
	: (process.env.VITE_TWELVE_DATA_API_KEY ?? process.env.VITE_TWLEVE_DATA_API_KEY ?? '');

export const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

/**
 * Check if we're in development mode
 * Uses import.meta.env which is available in both browser and test environments
 */
const isDev = browser ? (import.meta.env?.DEV ?? false) : false;

/**
 * CORS proxy URLs for external API requests
 * Primary: Custom Cloudflare Worker (faster, dedicated)
 * Fallback: corsproxy.io (public, may rate limit)
 */
export const CORS_PROXIES = {
	// The Cloudflare worker blocks many finance domains (403). Use a permissive public proxy.
	primary: 'https://corsproxy.io/?url=',
	fallback: 'https://corsproxy.io/?url='
} as const;

// Default export for backward compatibility
export const CORS_PROXY_URL = CORS_PROXIES.fallback;

/**
 * Fetch with CORS proxy fallback
 * Tries primary proxy first, falls back to secondary on failure
 */
export async function fetchWithProxy(url: string): Promise<Response> {
	const encodedUrl = encodeURIComponent(url);

	// Try primary proxy first
	try {
		const response = await fetch(CORS_PROXIES.primary + encodedUrl);
		if (response.ok) {
			return response;
		}
		// If we get an error response, try fallback
		logger.warn('API', `Primary proxy failed (${response.status}), trying fallback`);
	} catch (error) {
		logger.warn('API', 'Primary proxy error, trying fallback:', error);
	}

	// Fallback to secondary proxy
	return fetch(CORS_PROXIES.fallback + encodedUrl);
}

/**
 * API request delays (ms) to avoid rate limiting
 */
export const API_DELAYS = {
	betweenCategories: 500,
	betweenRetries: 1000
} as const;

/**
 * Cache TTLs (ms)
 */
export const CACHE_TTLS = {
	weather: 10 * 60 * 1000, // 10 minutes
	news: 5 * 60 * 1000, // 5 minutes
	markets: 60 * 1000, // 1 minute
	default: 5 * 60 * 1000 // 5 minutes
} as const;

/**
 * Debug/logging configuration
 */
export const DEBUG = {
	enabled: isDev,
	logApiCalls: isDev,
	logCacheHits: false
} as const;

/**
 * Conditional logger - only logs in development
 */
export const logger = {
	log: (prefix: string, ...args: unknown[]) => {
		if (DEBUG.logApiCalls) {
			console.log(`[${prefix}]`, ...args);
		}
	},
	warn: (prefix: string, ...args: unknown[]) => {
		console.warn(`[${prefix}]`, ...args);
	},
	error: (prefix: string, ...args: unknown[]) => {
		console.error(`[${prefix}]`, ...args);
	}
};
