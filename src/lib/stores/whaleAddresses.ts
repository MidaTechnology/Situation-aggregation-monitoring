/**
 * Whale addresses store - user-added wallet addresses to monitor (persisted).
 * When VITE_WHALE_ALERT_API_KEY is set, adds/removes Wallet Watch alerts via Cryptocurrency Alerting API.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { createWalletWatchAlert, deleteWalletAlert } from '$lib/api/whaleAlert';

const STORAGE_KEY = 'situationMonitorWhaleAddresses';
const STORAGE_KEY_ALERT_IDS = 'situationMonitorWhaleAlertIds';
const MAX_ADDRESSES = 30;
const MIN_LENGTH = 8;

function getApiKey(): string | undefined {
	if (typeof import.meta === 'undefined') return undefined;
	return (import.meta as unknown as { env?: { VITE_WHALE_ALERT_API_KEY?: string } }).env
		?.VITE_WHALE_ALERT_API_KEY;
}

function loadAlertIds(): Record<string, number> {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY_ALERT_IDS);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as unknown;
		if (typeof parsed !== 'object' || parsed === null) return {};
		return parsed as Record<string, number>;
	} catch {
		return {};
	}
}

function saveAlertIds(map: Record<string, number>): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY_ALERT_IDS, JSON.stringify(map));
	} catch (e) {
		console.warn('Failed to save whale alert IDs:', e);
	}
}

function isValidAddress(addr: string): boolean {
	const trimmed = addr.trim();
	if (trimmed.length < MIN_LENGTH) return false;
	// 0x (EVM), bc1 / 1 / 3 (Bitcoin), or base58-like
	return (
		/^0x[a-fA-F0-9]{10,}$/.test(trimmed) ||
		/^[13bc][a-km-zA-HJ-NP-Z1-9]{25,}$/.test(trimmed) ||
		trimmed.length >= MIN_LENGTH
	);
}

function normalizeAddress(addr: string): string {
	return addr.trim();
}

function loadAddresses(): string[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((s): s is string => typeof s === 'string' && s.length >= MIN_LENGTH)
			.slice(0, MAX_ADDRESSES);
	} catch {
		return [];
	}
}

function save(list: string[]): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch (e) {
		console.warn('Failed to save whale addresses:', e);
	}
}

function createWhaleAddressesStore() {
	const { subscribe, set, update } = writable<string[]>(loadAddresses());

	return {
		subscribe,

		getAddresses(): string[] {
			return get({ subscribe });
		},

		addAddress(addr: string): { ok: boolean; error?: string } {
			const normalized = normalizeAddress(addr);
			if (normalized.length < MIN_LENGTH) {
				return { ok: false, error: 'Address too short' };
			}
			if (!isValidAddress(normalized)) {
				return { ok: false, error: 'Invalid address format' };
			}
			let added = false;
			update((list) => {
				if (list.length >= MAX_ADDRESSES) return list;
				const lower = list.map((a) => a.toLowerCase());
				if (lower.includes(normalized.toLowerCase())) return list;
				added = true;
				const next = [...list, normalized];
				save(next);
				return next;
			});
			if (added && browser) {
				const apiKey = getApiKey();
				if (apiKey) {
					createWalletWatchAlert(apiKey, normalized).then((res) => {
						if (res.ok) {
							const ids = loadAlertIds();
							ids[normalized] = res.id;
							saveAlertIds(ids);
						}
					});
				}
			}
			return added ? { ok: true } : { ok: false, error: 'Max addresses reached' };
		},

		async removeAddress(addr: string): Promise<void> {
			const normalized = normalizeAddress(addr);
			if (browser) {
				const apiKey = getApiKey();
				const ids = loadAlertIds();
				const alertId = ids[normalized];
				if (apiKey && alertId != null) {
					await deleteWalletAlert(apiKey, alertId);
				}
				delete ids[normalized];
				saveAlertIds(ids);
			}
			update((list) => {
				const next = list.filter(
					(a) => normalizeAddress(a).toLowerCase() !== normalized.toLowerCase()
				);
				save(next);
				return next;
			});
		},

		reset(): void {
			save([]);
			set([]);
		}
	};
}

export const whaleAddresses = createWhaleAddressesStore();
