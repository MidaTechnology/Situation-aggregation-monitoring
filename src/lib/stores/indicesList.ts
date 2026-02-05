/**
 * Indices list store - user-selected indices/stocks for the markets panel (persisted)
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { INDICES, INDICE_OPTIONS, type IndexConfig } from '$lib/config';

const STORAGE_KEY = 'situationMonitorIndicesList';
const MAX_INDICES = 25;

const defaultList: IndexConfig[] = [...INDICES];

function loadSavedList(): IndexConfig[] {
	if (!browser) return [...defaultList];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [...defaultList];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [...defaultList];
		const list = parsed.filter(
			(item): item is IndexConfig =>
				typeof item === 'object' &&
				item !== null &&
				typeof (item as IndexConfig).symbol === 'string' &&
				typeof (item as IndexConfig).name === 'string'
		);
		return list.length > 0 ? list : [...defaultList];
	} catch {
		return [...defaultList];
	}
}

function save(list: IndexConfig[]): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch (e) {
		console.warn('Failed to save indices list:', e);
	}
}

function createIndicesListStore() {
	const { subscribe, set, update } = writable<IndexConfig[]>(loadSavedList());

	return {
		subscribe,

		getSelectedConfig(): IndexConfig[] {
			return get({ subscribe });
		},

		/** Add an index/stock by symbol and name. Returns true if added. */
		addIndex(entry: IndexConfig): boolean {
			const symbol = (entry.symbol || '').trim();
			const name = (entry.name || entry.symbol || symbol).trim();
			if (!symbol) return false;
			let added = false;
			update((list) => {
				if (list.some((i) => i.symbol.toUpperCase() === symbol.toUpperCase())) return list;
				if (list.length >= MAX_INDICES) return list;
				added = true;
				const next = [...list, { symbol, name }];
				save(next);
				return next;
			});
			return added;
		},

		/** Add from preset (INDICE_OPTIONS). Returns true if added. */
		addFromPreset(symbol: string): boolean {
			const opt = INDICE_OPTIONS.find((o) => o.symbol === symbol);
			if (!opt) return false;
			return this.addIndex(opt);
		},

		removeIndex(symbol: string): void {
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
		moveIndex(fromSymbol: string, toSymbol: string): void {
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

export const indicesList = createIndicesListStore();
