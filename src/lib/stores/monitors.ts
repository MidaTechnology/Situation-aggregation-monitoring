/**
 * Monitors store - custom user monitors CRUD
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { CustomMonitor, NewsItem } from '$lib/types';
import type { FedNewsItem } from '$lib/api/fred';
import type { BlockBeatsFlashItem } from '$lib/api/blockbeats';
import type { Prediction } from '$lib/api/misc';

const STORAGE_KEY = 'customMonitors';
const MAX_MONITORS = 20;

/** Normalized item for monitor matching (from GDELT, Fed RSS, BlockBeats, Polymarket, etc.) */
export interface MonitorMatchItem {
	id: string;
	title: string;
	link?: string;
	timestamp: number;
	sourceLabel: string;
}

export interface MonitorMatch {
	monitor: CustomMonitor;
	item: MonitorMatchItem;
	matchedKeywords: string[];
}

export interface MonitorsState {
	monitors: CustomMonitor[];
	matches: MonitorMatch[];
	initialized: boolean;
}

// Load monitors from localStorage
function loadMonitors(): CustomMonitor[] {
	if (!browser) return [];

	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (e) {
		console.warn('Failed to load monitors from localStorage:', e);
		return [];
	}
}

// Save monitors to localStorage
function saveMonitors(monitors: CustomMonitor[]): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(monitors));
	} catch (e) {
		console.warn('Failed to save monitors to localStorage:', e);
	}
}

// Generate a unique ID
function generateId(): string {
	return `mon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Normalize sources to matchable entries (item + text to search) */
interface MatchableEntry {
	item: MonitorMatchItem;
	textToSearch: string;
}

function toMatchable(item: NewsItem): MatchableEntry {
	const text = `${item.title} ${item.description || ''}`.toLowerCase();
	return {
		item: {
			id: item.id,
			title: item.title,
			link: item.link,
			timestamp: item.timestamp,
			sourceLabel: item.source || item.category
		},
		textToSearch: text
	};
}

function fedToMatchable(item: FedNewsItem): MatchableEntry {
	const text = `${item.title} ${item.description || ''}`.toLowerCase();
	return {
		item: {
			id: item.id,
			title: item.title,
			link: item.link,
			timestamp: item.timestamp,
			sourceLabel: 'Fed RSS'
		},
		textToSearch: text
	};
}

function blockbeatsToMatchable(item: BlockBeatsFlashItem): MatchableEntry {
	const text = `${item.title} ${item.content || ''}`.toLowerCase();
	return {
		item: {
			id: String(item.id),
			title: item.title,
			link: item.link || item.url,
			timestamp: item.create_time ? new Date(item.create_time).getTime() : Date.now(),
			sourceLabel: 'BlockBeats'
		},
		textToSearch: text
	};
}

function polymarketToMatchable(item: Prediction): MatchableEntry {
	const text = (item.question || '').toLowerCase();
	return {
		item: {
			id: item.id,
			title: item.question,
			link: item.url,
			timestamp: Date.now(),
			sourceLabel: 'Polymarket'
		},
		textToSearch: text
	};
}

function runKeywordScan(entries: MatchableEntry[], getMonitors: () => CustomMonitor[]): MonitorMatch[] {
	const matches: MonitorMatch[] = [];
	const monitorsList = getMonitors();

	for (const monitor of monitorsList) {
		if (!monitor.enabled) continue;

		for (const { item, textToSearch } of entries) {
			const matchedKeywords: string[] = [];

			for (const keyword of monitor.keywords) {
				if (textToSearch.includes(keyword.toLowerCase())) {
					matchedKeywords.push(keyword);
				}
			}

			if (matchedKeywords.length > 0) {
				matches.push({ monitor, item, matchedKeywords });
			}
		}
	}

	return matches;
}

// Create the store
function createMonitorsStore() {
	const initialState: MonitorsState = {
		monitors: loadMonitors(),
		matches: [],
		initialized: false
	};

	const { subscribe, set, update } = writable<MonitorsState>(initialState);

	return {
		subscribe,

		/**
		 * Initialize store (call after hydration)
		 */
		init() {
			update((state) => ({ ...state, initialized: true }));
		},

		/**
		 * Get all monitors
		 */
		getMonitors(): CustomMonitor[] {
			return get({ subscribe }).monitors;
		},

		/**
		 * Get a specific monitor by ID
		 */
		getMonitor(id: string): CustomMonitor | undefined {
			return get({ subscribe }).monitors.find((m) => m.id === id);
		},

		/**
		 * Add a new monitor
		 */
		addMonitor(
			monitor: Omit<CustomMonitor, 'id' | 'createdAt' | 'matchCount'>
		): CustomMonitor | null {
			const state = get({ subscribe });

			if (state.monitors.length >= MAX_MONITORS) {
				console.warn(`Maximum monitors (${MAX_MONITORS}) reached`);
				return null;
			}

			const newMonitor: CustomMonitor = {
				...monitor,
				id: generateId(),
				createdAt: Date.now(),
				matchCount: 0
			};

			update((s) => {
				const newMonitors = [...s.monitors, newMonitor];
				saveMonitors(newMonitors);
				return { ...s, monitors: newMonitors };
			});

			return newMonitor;
		},

		/**
		 * Update an existing monitor
		 */
		updateMonitor(id: string, updates: Partial<Omit<CustomMonitor, 'id' | 'createdAt'>>): boolean {
			let found = false;

			update((state) => {
				const index = state.monitors.findIndex((m) => m.id === id);
				if (index === -1) return state;

				found = true;
				const newMonitors = [...state.monitors];
				newMonitors[index] = { ...newMonitors[index], ...updates };
				saveMonitors(newMonitors);
				return { ...state, monitors: newMonitors };
			});

			return found;
		},

		/**
		 * Delete a monitor
		 */
		deleteMonitor(id: string): boolean {
			let found = false;

			update((state) => {
				const index = state.monitors.findIndex((m) => m.id === id);
				if (index === -1) return state;

				found = true;
				const newMonitors = state.monitors.filter((m) => m.id !== id);
				const newMatches = state.matches.filter((m) => m.monitor.id !== id);
				saveMonitors(newMonitors);
				return { ...state, monitors: newMonitors, matches: newMatches };
			});

			return found;
		},

		/**
		 * Toggle monitor enabled state
		 */
		toggleMonitor(id: string): void {
			update((state) => {
				const index = state.monitors.findIndex((m) => m.id === id);
				if (index === -1) return state;

				const newMonitors = [...state.monitors];
				newMonitors[index] = {
					...newMonitors[index],
					enabled: !newMonitors[index].enabled
				};
				saveMonitors(newMonitors);
				return { ...state, monitors: newMonitors };
			});
		},

		/**
		 * Scan news items for monitor matches (GDELT only; backward compatible)
		 */
		scanForMatches(newsItems: NewsItem[]): MonitorMatch[] {
			const entries = newsItems.map(toMatchable);
			return this.scanFromEntries(entries);
		},

		/**
		 * Scan all sources (GDELT, Fed RSS, BlockBeats, Polymarket) for monitor matches
		 */
		scanAllSources(
			newsItems: NewsItem[],
			fedItems: FedNewsItem[] = [],
			blockbeatsItems: BlockBeatsFlashItem[] = [],
			polymarketItems: Prediction[] = []
		): MonitorMatch[] {
			const entries: MatchableEntry[] = [
				...newsItems.map(toMatchable),
				...fedItems.map(fedToMatchable),
				...blockbeatsItems.map(blockbeatsToMatchable),
				...polymarketItems.map(polymarketToMatchable)
			];
			return this.scanFromEntries(entries);
		},

		/** Internal: run keyword scan and update store */
		scanFromEntries(entries: MatchableEntry[]): MonitorMatch[] {
			const state = get({ subscribe });
			const matches = runKeywordScan(entries, () => state.monitors);
			// Sort matches by item timestamp desc (newest first)
			matches.sort((a, b) => b.item.timestamp - a.item.timestamp);

			update((s) => {
				const newMonitors = s.monitors.map((m) => ({
					...m,
					matchCount: matches.filter((match) => match.monitor.id === m.id).length
				}));
				saveMonitors(newMonitors);
				return { ...s, monitors: newMonitors, matches };
			});

			return matches;
		},

		/**
		 * Clear all matches
		 */
		clearMatches(): void {
			update((state) => ({ ...state, matches: [] }));
		},

		/**
		 * Reset all monitors
		 */
		reset(): void {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set({ monitors: [], matches: [], initialized: true });
		}
	};
}

// Export singleton store
export const monitors = createMonitorsStore();

// Derived stores
export const enabledMonitors = derived(monitors, ($monitors) =>
	$monitors.monitors.filter((m) => m.enabled)
);

export const monitorCount = derived(monitors, ($monitors) => $monitors.monitors.length);

export const matchCount = derived(monitors, ($monitors) => $monitors.matches.length);

export const hasMatches = derived(monitors, ($monitors) => $monitors.matches.length > 0);
