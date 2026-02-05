/**
 * Polymarket prediction markets via Gamma API
 * @see https://docs.polymarket.com/quickstart/fetching-data
 * @see https://docs.polymarket.com/developers/gamma-markets-api/get-events
 * Uses CORS proxy so browser requests are not blocked.
 */

import type { Prediction } from './misc';
import { CORS_PROXIES } from '$lib/config/api';

const GAMMA_BASE = 'https://gamma-api.polymarket.com';
const EVENT_URL = 'https://polymarket.com/event';

interface GammaMarket {
	id?: string;
	question?: string;
	outcomes?: string;
	outcomePrices?: string;
	volume?: string;
	volumeNum?: number;
	closed?: boolean;
	active?: boolean;
}

interface GammaEvent {
	id?: string;
	slug?: string;
	title?: string;
	volume?: number;
	volume24hr?: number;
	markets?: GammaMarket[];
}

function formatVolume(value: number | string | undefined): string {
	if (value === undefined || value === null) return '—';
	const n = typeof value === 'string' ? parseFloat(value) : value;
	if (Number.isNaN(n) || n <= 0) return '—';
	if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
	if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
	return n.toFixed(0);
}

function parseYesPercent(market: GammaMarket): number {
	const pricesRaw = market.outcomePrices;
	const outcomesRaw = market.outcomes;
	if (!pricesRaw || !outcomesRaw) return 50;
	try {
		const prices = JSON.parse(pricesRaw) as string[];
		const outcomes = JSON.parse(outcomesRaw) as string[];
		const yesIdx = outcomes.findIndex((o) => o?.toLowerCase() === 'yes');
		if (yesIdx >= 0 && prices[yesIdx] != null) {
			const p = parseFloat(String(prices[yesIdx]));
			return Number.isNaN(p) ? 50 : Math.round(Math.min(100, Math.max(0, p * 100)));
		}
	} catch {
		// ignore
	}
	return 50;
}

/**
 * Fetch via CORS proxy. Try fallback first (often better with long URLs), then primary.
 */
async function fetchGammaWithProxy(url: string): Promise<Response> {
	const encoded = encodeURIComponent(url);
	try {
		const res = await fetch(CORS_PROXIES.fallback + encoded);
		if (res.ok) return res;
		if (res.status === 413) throw new Error('413');
	} catch (e) {
		if (String(e) === 'Error: 413') throw e;
	}
	return fetch(CORS_PROXIES.primary + encoded);
}

/**
 * Fetch active prediction markets from Polymarket Gamma API.
 * No authentication required.
 */
export async function fetchPolymarket(): Promise<Prediction[]> {
	// Shorter URLs to avoid 413 (Request Entity Too Large) from CORS proxies
	const urls = [
		`${GAMMA_BASE}/events?active=true&closed=false&limit=20`,
		`${GAMMA_BASE}/events?active=true&closed=false&limit=10`
	];
	let res: Response | null = null;
	for (const url of urls) {
		try {
			res = await fetchGammaWithProxy(url);
			if (res.ok) break;
			if (res.status === 413) continue;
			throw new Error(`Polymarket API error: ${res.status}`);
		} catch (e) {
			if (e instanceof Error && e.message === '413') continue;
			throw e;
		}
	}
	if (!res?.ok) {
		throw new Error('Polymarket API error: 413');
	}
	const raw = (await res.json()) as GammaEvent[];
	// Sort by 24h volume (then total volume) so hottest events appear first
	const events = [...raw].sort((a, b) => {
		const va = a.volume24hr ?? a.volume ?? 0;
		const vb = b.volume24hr ?? b.volume ?? 0;
		return vb - va;
	});
	const out: Prediction[] = [];
	const seen = new Set<string>();

	for (const event of events) {
		const markets = event.markets ?? [];
		const eventSlug = event.slug ?? event.id ?? '';
		const eventVolume = event.volume;

		for (const market of markets) {
			// Skip resolved/closed markets (they show 0% or 100%, not current odds)
			if (market.closed === true) continue;

			const question = market.question ?? event.title ?? '';
			if (!question.trim()) continue;

			const id = market.id ?? `${event.id}-${market.question ?? Math.random()}`;
			if (seen.has(id)) continue;
			seen.add(id);

			const yes = parseYesPercent(market);
			const vol =
				market.volumeNum != null
					? formatVolume(market.volumeNum)
					: market.volume
						? formatVolume(market.volume)
						: eventVolume != null
							? formatVolume(eventVolume)
							: '—';

			out.push({
				id,
				question,
				yes,
				volume: vol,
				...(eventSlug && { url: `${EVENT_URL}/${eventSlug}` })
			});
		}
	}

	return out.slice(0, 20);
}
