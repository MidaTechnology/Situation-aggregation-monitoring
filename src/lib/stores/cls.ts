import { writable, get } from 'svelte/store';
import { fetchClsTelegraph, type ClsTelegraphItem } from '$lib/api/cls';

interface ClsState {
	items: ClsTelegraphItem[];
	loading: boolean;
	error: string | null;
}

const initialState: ClsState = {
	items: [],
	loading: false,
	error: null
};

function createClsStore() {
	const { subscribe, set, update } = writable<ClsState>(initialState);

	return {
		subscribe,

		get items() {
			return get({ subscribe }).items;
		},

		get loading() {
			return get({ subscribe }).loading;
		},

		get error() {
			return get({ subscribe }).error;
		},

		/** Load latest CLS telegraph items */
		async load(silent = false): Promise<void> {
			if (!silent) update((s) => ({ ...s, loading: true, error: null }));
			try {
				const items = await fetchClsTelegraph();
				update((s) => ({ ...s, items, loading: false, error: null }));
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				update((s) => ({ ...s, items: [], loading: false, error: msg }));
			}
		},

		reset(): void {
			set(initialState);
		}
	};
}

export const clsTelegraph = createClsStore();

