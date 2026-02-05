/**
 * GET /api/eastmoney?secid=1.601012
 * Server-side proxy for Eastmoney Push2 API (avoids CORS and 403 from public proxies).
 * Used for China A-share quotes. Works in dev and on Vercel; static deploy falls back to client proxy.
 */

const EASTMONEY_BASE =
	'https://push2.eastmoney.com/api/qt/stock/get';

export async function GET({ url }) {
	const secid = url.searchParams.get('secid');
	if (!secid || !/^[01]\.\d{6}$/.test(secid)) {
		return new Response(JSON.stringify({ error: 'Invalid secid' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const target = `${EASTMONEY_BASE}?secid=${encodeURIComponent(secid)}&fields=f43,f169,f170,f44,f45,f46,f47,f48,f58,f60`;
	try {
		const res = await fetch(target, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Referer: 'https://www.eastmoney.com/'
			}
		});
		if (!res.ok) {
			return new Response(JSON.stringify({ error: `Upstream ${res.status}` }), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		const data = await res.json();
		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=60'
			}
		});
	} catch (e) {
		return new Response(
			JSON.stringify({ error: e instanceof Error ? e.message : 'Proxy error' }),
			{ status: 502, headers: { 'Content-Type': 'application/json' } }
		);
	}
}
