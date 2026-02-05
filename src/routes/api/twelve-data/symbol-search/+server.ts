/**
 * Server-side proxy for Twelve Data symbol_search (avoids CORS).
 * GET /api/twelve-data/symbol-search?q=AAPL
 * Returns: { data: [{ symbol, instrument_name, ... }], status } or { error }.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

export const GET: RequestHandler = async ({ url }) => {
	const apiKey =
		(import.meta.env?.VITE_TWELVE_DATA_API_KEY ??
			import.meta.env?.VITE_TWLEVE_DATA_API_KEY ??
			process.env.VITE_TWELVE_DATA_API_KEY ??
			process.env.VITE_TWLEVE_DATA_API_KEY)?.trim();
	if (!apiKey) {
		return json({ error: 'Twelve Data API key not configured' }, { status: 500 });
	}

	const q = url.searchParams.get('q')?.trim();
	if (!q || q.length < 2) {
		return json({ error: 'Query too short' }, { status: 400 });
	}

	const target = `${TWELVE_DATA_BASE}/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=30&apikey=${apiKey}`;
	try {
		const res = await fetch(target, { method: 'GET' });
		const data = await res.json();

		if (!res.ok) {
			return json(
				{ error: (data as { message?: string }).message ?? `HTTP ${res.status}` },
				{ status: res.status >= 500 ? 502 : res.status }
			);
		}

		return json(data);
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Request failed' },
			{ status: 502 }
		);
	}
};
