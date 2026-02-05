/**
 * Settings store - panel visibility, order, sizes, and locale
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import {
	PANELS,
	PANEL_ORDER,
	NON_DRAGGABLE_PANELS,
	PRESETS,
	ONBOARDING_STORAGE_KEY,
	PRESET_STORAGE_KEY,
	type PanelId,
	type Locale
} from '$lib/config';

// Storage keys
const STORAGE_KEYS = {
	panels: 'situationMonitorPanels',
	order: 'panelOrder',
	sizes: 'panelSizes',
	panelCollapsed: 'situationMonitorPanelCollapsed',
	panelCollapseTouched: 'situationMonitorPanelCollapseTouched',
	pinned: 'situationMonitorPinned',
	locale: 'situationMonitorLocale',
	theme: 'situationMonitorTheme'
} as const;

export type Theme = 'dark' | 'light';

// Types
export interface PanelSettings {
	enabled: Record<PanelId, boolean>;
	order: PanelId[];
	sizes: Record<PanelId, { width?: number; height?: number }>;
	panelCollapsed: Record<PanelId, boolean>;
	/** User has explicitly toggled collapse for this panel - respect storedCollapsed even when hasData */
	panelCollapseTouched: Record<PanelId, boolean>;
	pinned: PanelId[];
}

export interface SettingsState extends PanelSettings {
	locale: Locale;
	theme: Theme;
	initialized: boolean;
}

// Default settings: priority 2/3 panels start collapsed for a cleaner first view
function getDefaultSettings(): PanelSettings {
	const allPanelIds = Object.keys(PANELS) as PanelId[];

	return {
		enabled: Object.fromEntries(allPanelIds.map((id) => [id, true])) as Record<PanelId, boolean>,
		order: [...PANEL_ORDER],
		sizes: {} as Record<PanelId, { width?: number; height?: number }>,
		panelCollapsed: Object.fromEntries(
			allPanelIds.map((id) => [
				id,
				(PANELS as Record<PanelId, { priority: number }>)[id].priority > 1
			])
		) as Record<PanelId, boolean>,
		panelCollapseTouched: {} as Record<PanelId, boolean>,
		pinned: []
	};
}

// Load from localStorage
function loadFromStorage(): Partial<PanelSettings> & { locale?: Locale; theme?: Theme } {
	if (!browser) return {};

	try {
		const panels = localStorage.getItem(STORAGE_KEYS.panels);
		const order = localStorage.getItem(STORAGE_KEYS.order);
		const sizes = localStorage.getItem(STORAGE_KEYS.sizes);
		const panelCollapsed = localStorage.getItem(STORAGE_KEYS.panelCollapsed);
		const panelCollapseTouched = localStorage.getItem(STORAGE_KEYS.panelCollapseTouched);
		const pinned = localStorage.getItem(STORAGE_KEYS.pinned);
		const locale = localStorage.getItem(STORAGE_KEYS.locale) as Locale | null;
		const theme = localStorage.getItem(STORAGE_KEYS.theme) as Theme | null;

		return {
			enabled: panels ? JSON.parse(panels) : undefined,
			order: order ? JSON.parse(order) : undefined,
			sizes: sizes ? JSON.parse(sizes) : undefined,
			panelCollapsed: panelCollapsed ? JSON.parse(panelCollapsed) : undefined,
			panelCollapseTouched: panelCollapseTouched ? JSON.parse(panelCollapseTouched) : undefined,
			pinned: pinned ? JSON.parse(pinned) : undefined,
			locale: locale === 'zh' || locale === 'en' ? locale : undefined,
			theme: theme === 'dark' || theme === 'light' ? theme : undefined
		};
	} catch (e) {
		console.warn('Failed to load settings from localStorage:', e);
		return {};
	}
}

// Save to localStorage
function saveToStorage(key: keyof typeof STORAGE_KEYS, value: unknown): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
	} catch (e) {
		console.warn(`Failed to save ${key} to localStorage:`, e);
	}
}

// Merge saved order with PANEL_ORDER so new panels (e.g. aiInsights) appear for existing users
function mergeOrder(savedOrder: PanelId[] | undefined): PanelId[] {
	const order = savedOrder ?? [...PANEL_ORDER];
	const missing = PANEL_ORDER.filter((id) => !order.includes(id));
	if (missing.length === 0) return order;
	return [...order, ...missing];
}

// Create the store
function createSettingsStore() {
	const defaults = getDefaultSettings();
	const saved = loadFromStorage();

	const initialState: SettingsState = {
		enabled: { ...defaults.enabled, ...saved.enabled },
		order: mergeOrder(saved.order),
		sizes: { ...defaults.sizes, ...saved.sizes },
		panelCollapsed: { ...defaults.panelCollapsed, ...saved.panelCollapsed },
		panelCollapseTouched: { ...defaults.panelCollapseTouched, ...saved.panelCollapseTouched },
		pinned: saved.pinned ?? defaults.pinned,
		locale: saved.locale ?? 'zh',
		theme: saved.theme ?? 'dark',
		initialized: false
	};

	const { subscribe, set, update } = writable<SettingsState>(initialState);

	return {
		subscribe,

		/**
		 * Initialize store (call after hydration)
		 */
		init() {
			update((state) => {
				if (browser) document.documentElement.setAttribute('data-theme', state.theme);
				return { ...state, initialized: true };
			});
		},

		/**
		 * Check if a panel is enabled
		 */
		isPanelEnabled(panelId: PanelId): boolean {
			const state = get({ subscribe });
			return state.enabled[panelId] ?? true;
		},

		/**
		 * Toggle panel visibility
		 */
		togglePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = {
					...state.enabled,
					[panelId]: !state.enabled[panelId]
				};
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Enable a specific panel
		 */
		enablePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = { ...state.enabled, [panelId]: true };
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Disable a specific panel
		 */
		disablePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = { ...state.enabled, [panelId]: false };
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Toggle panel collapsed state (priority 2/3 panels start collapsed for a cleaner view).
		 * Marks panel as "touched" so collapse is respected even when panel has data.
		 */
		togglePanelCollapse(panelId: PanelId) {
			update((state) => {
				const next = !(state.panelCollapsed[panelId] ?? false);
				const newCollapsed = { ...state.panelCollapsed, [panelId]: next };
				const newTouched = { ...state.panelCollapseTouched, [panelId]: true };
				saveToStorage('panelCollapsed', newCollapsed);
				saveToStorage('panelCollapseTouched', newTouched);
				return { ...state, panelCollapsed: newCollapsed, panelCollapseTouched: newTouched };
			});
		},

		/**
		 * Toggle panel pinned (pin to top). Newly pinned goes to the very front.
		 * Unpin: remove from pinned and move panel to right after the last pinned (so pinned stay above).
		 */
		togglePin(panelId: PanelId) {
			update((state) => {
				const idx = state.pinned.indexOf(panelId);
				const newPinned =
					idx === -1 ? [panelId, ...state.pinned] : state.pinned.filter((id) => id !== panelId);
				let newOrder = state.order;
				if (idx === -1) {
					newOrder = [panelId, ...state.order.filter((id) => id !== panelId)];
					saveToStorage('order', newOrder);
				} else {
					// Unpin: move this panel to right after the last pinned so pinned rows stay above
					const without = state.order.filter((id) => id !== panelId);
					const pinnedSet = new Set(newPinned);
					let insertIndex = 0;
					for (let i = 0; i < without.length; i++) {
						if (pinnedSet.has(without[i])) insertIndex = i + 1;
					}
					newOrder = [...without.slice(0, insertIndex), panelId, ...without.slice(insertIndex)];
					saveToStorage('order', newOrder);
				}
				saveToStorage('pinned', newPinned);
				return { ...state, pinned: newPinned, order: newOrder };
			});
		},

		/**
		 * Check if a panel is pinned
		 */
		isPinned(panelId: PanelId): boolean {
			const state = get({ subscribe });
			return state.pinned.includes(panelId);
		},

		/**
		 * Update panel order (for drag-drop). Syncs pinned to match new order (pinned ids keep their new positions).
		 */
		updateOrder(newOrder: PanelId[]) {
			update((state) => {
				const newPinned = newOrder.filter((id) => state.pinned.includes(id));
				saveToStorage('order', newOrder);
				saveToStorage('pinned', newPinned);
				return { ...state, order: newOrder, pinned: newPinned };
			});
		},

		/**
		 * Move a panel to a new position
		 */
		movePanel(panelId: PanelId, toIndex: number) {
			// Don't allow moving non-draggable panels
			if (NON_DRAGGABLE_PANELS.includes(panelId)) return;

			update((state) => {
				const currentIndex = state.order.indexOf(panelId);
				if (currentIndex === -1) return state;

				const newOrder = [...state.order];
				newOrder.splice(currentIndex, 1);
				newOrder.splice(toIndex, 0, panelId);

				saveToStorage('order', newOrder);
				return { ...state, order: newOrder };
			});
		},

		/**
		 * Update panel size
		 */
		updateSize(panelId: PanelId, size: { width?: number; height?: number }) {
			update((state) => {
				const newSizes = {
					...state.sizes,
					[panelId]: { ...state.sizes[panelId], ...size }
				};
				saveToStorage('sizes', newSizes);
				return { ...state, sizes: newSizes };
			});
		},

		/**
		 * Set UI language (zh / en)
		 */
		setLocale(locale: Locale) {
			update((state) => {
				if (browser) localStorage.setItem(STORAGE_KEYS.locale, locale);
				return { ...state, locale };
			});
		},

		/**
		 * Set background theme (dark / light)
		 */
		setTheme(theme: Theme) {
			update((state) => {
				if (browser) {
					localStorage.setItem(STORAGE_KEYS.theme, theme);
					document.documentElement.setAttribute('data-theme', theme);
				}
				return { ...state, theme };
			});
		},

		/**
		 * Reset all settings to defaults (keeps current locale and theme)
		 */
		reset() {
			const state = get({ subscribe });
			const defaults = getDefaultSettings();
			if (browser) {
				localStorage.removeItem(STORAGE_KEYS.panels);
				localStorage.removeItem(STORAGE_KEYS.order);
				localStorage.removeItem(STORAGE_KEYS.sizes);
				localStorage.removeItem(STORAGE_KEYS.panelCollapsed);
				localStorage.removeItem(STORAGE_KEYS.panelCollapseTouched);
				localStorage.removeItem(STORAGE_KEYS.pinned);
			}
			set({ ...defaults, locale: state.locale, theme: state.theme, initialized: true });
		},

		/**
		 * Get panel size
		 */
		getPanelSize(panelId: PanelId): { width?: number; height?: number } | undefined {
			const state = get({ subscribe });
			return state.sizes[panelId];
		},

		/**
		 * Check if onboarding is complete
		 */
		isOnboardingComplete(): boolean {
			if (!browser) return true;
			return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
		},

		/**
		 * Get selected preset
		 */
		getSelectedPreset(): string | null {
			if (!browser) return null;
			return localStorage.getItem(PRESET_STORAGE_KEY);
		},

		/**
		 * Apply a preset configuration
		 */
		applyPreset(presetId: string) {
			const preset = PRESETS[presetId];
			if (!preset) {
				console.error('Unknown preset:', presetId);
				return;
			}

			// Build panel settings - disable all panels first, then enable preset panels
			const allPanelIds = Object.keys(PANELS) as PanelId[];
			const newEnabled = Object.fromEntries(
				allPanelIds.map((id) => [id, preset.panels.includes(id)])
			) as Record<PanelId, boolean>;

			update((state) => {
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});

			// Mark onboarding complete and save preset
			if (browser) {
				localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
				localStorage.setItem(PRESET_STORAGE_KEY, presetId);
			}
		},

		/**
		 * Reset onboarding to show modal again
		 */
		resetOnboarding() {
			if (browser) {
				localStorage.removeItem(ONBOARDING_STORAGE_KEY);
				localStorage.removeItem(PRESET_STORAGE_KEY);
			}
		}
	};
}

// Export singleton store
export const settings = createSettingsStore();

// Derived stores for convenience
export const enabledPanels = derived(settings, ($settings) =>
	$settings.order.filter((id) => $settings.enabled[id])
);

export const disabledPanels = derived(settings, ($settings) =>
	$settings.order.filter((id) => !$settings.enabled[id])
);

export const draggablePanels = derived(enabledPanels, ($enabled) =>
	$enabled.filter((id) => !NON_DRAGGABLE_PANELS.includes(id))
);
