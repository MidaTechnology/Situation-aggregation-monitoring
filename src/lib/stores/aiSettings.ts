/**
 * AI settings store - provider, API key, model (persisted in localStorage)
 * Used by AI Insights panel for self-configured API key.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { AIProviderId } from '$lib/config/ai-providers';

const STORAGE_KEY = 'situationMonitorAISettings';

export interface AISettings {
	provider: AIProviderId;
	apiKey: string;
	model?: string;
}

const defaultSettings: AISettings = {
	provider: 'deepseek',
	apiKey: '',
	model: undefined
};

function load(): AISettings {
	if (!browser) return { ...defaultSettings };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...defaultSettings };
		const parsed = JSON.parse(raw) as Partial<AISettings>;
		return {
			provider: parsed.provider ?? defaultSettings.provider,
			apiKey: parsed.apiKey ?? '',
			model: parsed.model ?? undefined
		};
	} catch {
		return { ...defaultSettings };
	}
}

function save(settings: AISettings): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.warn('Failed to save AI settings:', e);
	}
}

const { subscribe, update } = writable<AISettings>(load());

export const aiSettings = {
	subscribe,

	get(): AISettings {
		return get({ subscribe });
	},

	setProvider(provider: AIProviderId) {
		update((s) => {
			const next = { ...s, provider };
			save(next);
			return next;
		});
	},

	setApiKey(apiKey: string) {
		update((s) => {
			const next = { ...s, apiKey };
			save(next);
			return next;
		});
	},

	setModel(model: string | undefined) {
		update((s) => {
			const next = { ...s, model };
			save(next);
			return next;
		});
	},

	/** Set full settings (e.g. from modal save) */
	setAll(settings: Partial<AISettings>) {
		update((s) => {
			const next = { ...s, ...settings };
			save(next);
			return next;
		});
	},

	/** Clear API key only (keep provider/model) */
	clearApiKey() {
		update((s) => {
			const next = { ...s, apiKey: '' };
			save(next);
			return next;
		});
	}
};
