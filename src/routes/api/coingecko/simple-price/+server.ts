/**
 * GET /api/coingecko/simple-price?ids=ethereum,bitcoin,solana&vs_currencies=usd&include_24hr_change=true
 * Server-side proxy for CoinGecko simple/price with in-memory cache to avoid 429 (Too Many Requests).
 * Free tier is ~10–30 calls/min; cache TTL 90s reduces total requests.
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3/simple/price';
const CACHE_TTL_MS = 90 * 1000; // 90 seconds

interface CacheEntry {
	data: Record<string, unknown>;
	ts: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(ids: string, vs: string, include24: boolean): string {
	return `${ids}|${vs}|${include24}`;
}

export async function GET({ url }: { url: URL }) {
	const ids = url.searchParams.get('ids')?.trim() || '';
	const vs_currencies = url.searchParams.get('vs_currencies') || 'usd';
	const include_24hr_change = url.searchParams.get('include_24hr_change') === 'true';

	if (!ids) {
		return new Response(JSON.stringify({ error: 'Missing ids' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const key = getCacheKey(ids, vs_currencies, include_24hr_change);
	const now = Date.now();
	const hit = cache.get(key);
	if (hit && now - hit.ts < CACHE_TTL_MS) {
		return new Response(JSON.stringify(hit.data), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=60'
			}
		});
	}

	const params = new URLSearchParams({
		ids,
		vs_currencies,
		...(include_24hr_change ? { include_24hr_change: 'true' } : {})
	});
	const target = `${COINGECKO_BASE}?${params.toString()}`;

	try {
		const res = await fetch(target, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (compatible; SituationMonitor/1.0; +https://github.com/hipcityreg/situation-monitor)',
				Accept: 'application/json'
			}
		});

		if (!res.ok) {
			// On 429 or upstream error, return cached if available
			if (hit) {
				return new Response(JSON.stringify(hit.data), {
					headers: { 'Content-Type': 'application/json', 'X-Cache': 'stale' }
				});
			}
			return new Response(
				JSON.stringify({ error: `CoinGecko ${res.status}: ${res.statusText}` }),
				{ status: res.status, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const data = (await res.json()) as Record<string, unknown>;
		cache.set(key, { data, ts: now });
		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=60'
			}
		});
	} catch (e) {
		if (hit) {
			return new Response(JSON.stringify(hit.data), {
				headers: { 'Content-Type': 'application/json', 'X-Cache': 'stale' }
			});
		}
		return new Response(
			JSON.stringify({ error: e instanceof Error ? e.message : 'Proxy error' }),
			{ status: 502, headers: { 'Content-Type': 'application/json' } }
		);
	}
}
