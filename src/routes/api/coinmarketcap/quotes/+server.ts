/**
 * GET /api/coinmarketcap/quotes?symbol=BTC,ETH,SOL
 * Server-side proxy for CoinMarketCap quotes/latest. Keeps API key server-side and avoids CORS.
 * Used as fallback when CoinGecko fails or returns 429.
 */

import { env } from '$env/dynamic/private';
import { execFile } from 'node:child_process';

const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
const CACHE_TTL_MS = 60 * 1000; // 1 minute

interface CacheEntry {
	data: Record<string, unknown>;
	ts: number;
}

const cache = new Map<string, CacheEntry>();

// Read at request time so .env is available; prefer private name then VITE_ (process.env not populated in SvelteKit dev)
function getCmcKey(): string {
	return (env.COINMARKETCAP_API_KEY ?? env.VITE_COINMARKETCAP_API_KEY ?? '') as string;
}

export async function GET({ url }: { url: URL }) {
	const symbol = url.searchParams.get('symbol')?.trim() || '';
	const apiKey = getCmcKey();

	if (!symbol) {
		return new Response(JSON.stringify({ error: 'Missing symbol' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'CoinMarketCap API key not configured' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const key = symbol;
	const now = Date.now();
	const hit = cache.get(key);
	if (hit && now - hit.ts < CACHE_TTL_MS) {
		return new Response(JSON.stringify({ data: hit.data }), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=60'
			}
		});
	}

	const params = new URLSearchParams({ symbol, convert: 'USD' });
	const target = `${CMC_BASE}?${params.toString()}`;

	try {
		const res = await fetch(target, {
			headers: {
				Accept: 'application/json',
				'X-CMC_PRO_API_KEY': apiKey
			}
		});

		if (!res.ok) {
			if (hit) {
				return new Response(JSON.stringify({ data: hit.data }), {
					headers: { 'Content-Type': 'application/json', 'X-Cache': 'stale' }
				});
			}
			return new Response(
				JSON.stringify({ error: `CoinMarketCap ${res.status}: ${res.statusText}` }),
				{ status: res.status, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const json = (await res.json()) as { data?: Record<string, unknown> };
		const data = json?.data ?? {};
		cache.set(key, { data, ts: now });
		return new Response(JSON.stringify({ data }), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=60'
			}
		});
	} catch (e) {
		// Attempt curl fallback to bypass proxy/DNS issues
		const curlResult = await new Promise<{
			ok: boolean;
			status: number;
			data?: Record<string, unknown>;
			error?: string;
		}>((resolve) => {
			execFile(
				'curl',
				[
					'-sS',
					'-m',
					'10',
					'-H',
					'Accept: application/json',
					'-H',
					`X-CMC_PRO_API_KEY: ${apiKey}`,
					'-x',
					'',
					'-w',
					'\n%{http_code}',
					target
				],
				{ maxBuffer: 2 * 1024 * 1024 },
				(err2, stdout) => {
					if (err2) {
						return resolve({ ok: false, status: 0, error: err2.message });
					}
					const parts = stdout.trim().split('\n');
					const statusStr = parts.pop() || '';
					const bodyStr = parts.join('\n');
					const status = Number(statusStr) || 0;
					try {
						const json = JSON.parse(bodyStr) as { data?: Record<string, unknown> };
						return resolve({ ok: status >= 200 && status < 300, status, data: json?.data ?? {} });
					} catch (parseErr) {
						return resolve({
							ok: false,
							status,
							error: parseErr instanceof Error ? parseErr.message : String(parseErr)
						});
					}
				}
			);
		});
		if (curlResult.ok && curlResult.data) {
			return new Response(JSON.stringify({ data: curlResult.data }), {
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=60'
				}
			});
		}
		if (hit) {
			return new Response(JSON.stringify({ data: hit.data }), {
				headers: { 'Content-Type': 'application/json', 'X-Cache': 'stale' }
			});
		}
		return new Response(
			JSON.stringify({ error: e instanceof Error ? e.message : 'Proxy error' }),
			{ status: 502, headers: { 'Content-Type': 'application/json' } }
		);
	}
}
