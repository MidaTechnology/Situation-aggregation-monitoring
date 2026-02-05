/**
 * Crypto list store - user-selected coins for the crypto panel (persisted)
 * Same pattern as commodityList: stores { id, symbol, name }[], supports preset + search-added coins.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { CRYPTO, CRYPTO_OPTIONS, type CryptoOption } from '$lib/config';

const STORAGE_KEY = 'situationMonitorCryptoList';
const MAX_CRYPTO = 20;

const defaultList: CryptoOption[] = [...CRYPTO];
const presetById = new Map<string, CryptoOption>(
	CRYPTO_OPTIONS.map((c) => [c.id, c])
);

function loadSavedList(): CryptoOption[] {
	if (!browser) return [...defaultList];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as unknown;
			if (Array.isArray(parsed)) {
				const list = parsed.filter(
					(item): item is CryptoOption =>
						typeof item === 'object' &&
						item !== null &&
						typeof (item as CryptoOption).id === 'string' &&
						typeof (item as CryptoOption).symbol === 'string' &&
						typeof (item as CryptoOption).name === 'string'
				);
				if (list.length > 0) return list;
			}
		}
		// Legacy: old key stored array of ids
		const legacyKey = 'situationMonitorCryptoIds';
		const legacyRaw = localStorage.getItem(legacyKey);
		if (legacyRaw) {
			const ids = JSON.parse(legacyRaw) as unknown;
			if (Array.isArray(ids)) {
				const symbolIds = ids.filter((id): id is string => typeof id === 'string');
				if (symbolIds.length > 0) {
					const migrated = symbolIds.map((id) => {
						const preset = presetById.get(id);
						return preset ?? { id, symbol: id, name: id };
					});
					// Persist to new key so next load uses new format
					try {
						localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
					} catch {
						// ignore
					}
					return migrated;
				}
			}
		}
	} catch {
		// ignore
	}
	return [...defaultList];
}

function save(list: CryptoOption[]): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch (e) {
		console.warn('Failed to save crypto list:', e);
	}
}

function createCryptoListStore() {
	const { subscribe, set, update } = writable<CryptoOption[]>(loadSavedList());

	return {
		subscribe,

		getSelectedIds(): string[] {
			return get({ subscribe }).map((e) => e.id);
		},

		getSelectedConfig(): CryptoOption[] {
			return get({ subscribe });
		},

		/** Add a coin by id, symbol, name (from preset or search). Returns true if added. */
		addCrypto(entry: CryptoOption): boolean {
			const id = (entry.id || '').trim();
			const symbol = (entry.symbol || entry.id || id).trim();
			const name = (entry.name || entry.symbol || id).trim();
			if (!id) return false;
			let added = false;
			update((list) => {
				if (list.some((i) => i.id.toLowerCase() === id.toLowerCase())) return list;
				if (list.length >= MAX_CRYPTO) return list;
				added = true;
				const next = [...list, { id, symbol, name }];
				save(next);
				return next;
			});
			return added;
		},

		/** Add from preset (CRYPTO_OPTIONS). Returns true if added. */
		addFromPreset(id: string): boolean {
			const opt = CRYPTO_OPTIONS.find((o) => o.id === id);
			if (!opt) return false;
			return this.addCrypto(opt);
		},

		removeCrypto(id: string): void {
			update((list) => {
				const next = list.filter((i) => i.id !== id);
				if (next.length === 0) {
					save(defaultList);
					return defaultList;
				}
				save(next);
				return next;
			});
		},

		/** Move an item to a new position (drag & drop). */
		moveCrypto(fromId: string, toId: string): void {
			update((list) => {
				const fromIndex = list.findIndex((i) => i.id === fromId);
				const toIndex = list.findIndex((i) => i.id === toId);
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

export const cryptoList = createCryptoListStore();
