/**
 * Commodity list store - user-selected commodities for the commodities panel (persisted)
 * Same pattern as indicesList: stores { symbol, name }[], supports preset + search-added symbols.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { COMMODITIES, COMMODITY_OPTIONS, type CommodityConfig } from '$lib/config';

const STORAGE_KEY = 'situationMonitorCommodityList';
const MAX_COMMODITIES = 15;

export type CommodityEntry = { symbol: string; name: string };

const defaultList: CommodityEntry[] = COMMODITIES.map((c) => ({ symbol: c.symbol, name: c.name }));
const presetBySymbol = new Map<string, CommodityConfig>(
	COMMODITY_OPTIONS.map((c) => [c.symbol, c])
);

function loadSavedList(): CommodityEntry[] {
	if (!browser) return [...defaultList];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [...defaultList];
		const parsed = JSON.parse(raw) as unknown;
		// New format: array of { symbol, name }
		if (Array.isArray(parsed)) {
			const list = parsed.filter(
				(item): item is CommodityEntry =>
					typeof item === 'object' &&
					item !== null &&
					typeof (item as CommodityEntry).symbol === 'string' &&
					typeof (item as CommodityEntry).name === 'string'
			);
			if (list.length > 0) return list;
		}
		// Legacy: array of symbol strings
		if (Array.isArray(parsed)) {
			const symbols = parsed.filter((s): s is string => typeof s === 'string');
			if (symbols.length > 0) {
				const migrated = symbols.map((sym) => {
					const preset = presetBySymbol.get(sym);
					return { symbol: sym, name: preset?.name ?? sym };
				});
				return migrated;
			}
		}
	} catch {
		// ignore
	}
	return [...defaultList];
}

function save(list: CommodityEntry[]): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch (e) {
		console.warn('Failed to save commodity list:', e);
	}
}

function createCommodityListStore() {
	const { subscribe, set, update } = writable<CommodityEntry[]>(loadSavedList());

	return {
		subscribe,

		getSelectedConfig(): CommodityConfig[] {
			const list = get({ subscribe });
			return list.map((e) => {
				const preset = presetBySymbol.get(e.symbol);
				return {
					symbol: e.symbol,
					name: e.name,
					display: preset?.display ?? e.name
				};
			});
		},

		/** Add a commodity by symbol and name (from preset or search). Returns true if added. */
		addCommodity(entry: CommodityEntry): boolean {
			const symbol = (entry.symbol || '').trim();
			const name = (entry.name || entry.symbol || symbol).trim();
			if (!symbol) return false;
			let added = false;
			update((list) => {
				if (list.some((i) => i.symbol.toUpperCase() === symbol.toUpperCase())) return list;
				if (list.length >= MAX_COMMODITIES) return list;
				added = true;
				const next = [...list, { symbol, name }];
				save(next);
				return next;
			});
			return added;
		},

		/** Add from preset (COMMODITY_OPTIONS). Returns true if added. */
		addFromPreset(symbol: string): boolean {
			const opt = COMMODITY_OPTIONS.find((o) => o.symbol === symbol);
			if (!opt) return false;
			return this.addCommodity({ symbol: opt.symbol, name: opt.name });
		},

		removeCommodity(symbol: string): void {
			update((list) => {
				const next = list.filter((i) => i.symbol !== symbol);
				if (next.length === 0) {
					save(defaultList);
					return defaultList;
				}
				save(next);
				return next;
			});
		},

		/** Move an item to a new position (drag & drop). */
		moveCommodity(fromSymbol: string, toSymbol: string): void {
			update((list) => {
				const fromIndex = list.findIndex((i) => i.symbol === fromSymbol);
				const toIndex = list.findIndex((i) => i.symbol === toSymbol);
				if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return list;
				const next = [...list];
				const [moved] = next.splice(fromIndex, 1);
				next.splice(toIndex, 0, moved);
				save(next);
				return next;
			});
		},

		reset(): void {
			save(defaultList);
			set([...defaultList]);
		}
	};
}

export const commodityList = createCommodityListStore();
