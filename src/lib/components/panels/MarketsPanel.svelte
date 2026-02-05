<script lang="ts">
	import { Panel, MarketItem } from '$lib/components/common';
	import Modal from '$lib/components/modals/Modal.svelte';
	import { indices, settings, indicesList } from '$lib/stores';
	import { getPanelName, UI_TEXTS, INDICE_OPTIONS } from '$lib/config';
	import { searchSymbols } from '$lib/api/twelveData';
	import { flip } from 'svelte/animate';

	interface Props {
		onRetry?: () => void;
		onIndicesListChange?: () => void;
	}
	let { onRetry, onIndicesListChange }: Props = $props();

	const DEFAULT_PREVIEW = 10;
	let expanded = $state(false);
	let addModalOpen = $state(false);
	let searchQuery = $state('');
	let stockSearchQuery = $state('');
let searchResults = $state<{ symbol: string; name: string; exchange?: string }[]>([]);
	let searchLoading = $state(false);
	let searchDebounceId = $state<ReturnType<typeof setTimeout> | null>(null);
	// Track query for the in-flight request so we only apply result when it matches (avoids async callback reading stale input)
	let lastRequestedQuery = $state('');
	let searchResultsEl = $state<HTMLDivElement | null>(null);
	let draggingSymbol = $state<string | null>(null);
	let dragOverSymbol = $state<string | null>(null);
	let pressedSymbol = $state<string | null>(null);

	const items = $derived($indices.items);
	const loading = $derived($indices.loading);
	const error = $derived($indices.error);
	const count = $derived(items.length);
	const title = $derived(getPanelName('markets', $settings.locale));
	const emptyMarkets = $derived(UI_TEXTS[$settings.locale].empty.markets);
	const t = $derived(UI_TEXTS[$settings.locale].common);
	const tp = $derived(UI_TEXTS[$settings.locale].marketPicker);
	const modalCloseLabel = $derived(UI_TEXTS[$settings.locale].modal.close);
	const selectedList = $derived($indicesList);
	const canAddMore = $derived(selectedList.length < 25);
	const visibleItems = $derived(expanded ? items : items.slice(0, DEFAULT_PREVIEW));
	const hasMore = $derived(items.length > DEFAULT_PREVIEW);
	const moreCount = $derived(items.length - DEFAULT_PREVIEW);

	const selectedSymbolsSet = $derived(new Set(selectedList.map((i) => i.symbol.toUpperCase())));

	// Preset options filtered by search (symbol/name)
	const presetOptions = $derived(
		INDICE_OPTIONS.filter(
			(opt) =>
				!selectedSymbolsSet.has(opt.symbol.toUpperCase()) &&
				(searchQuery === '' ||
					opt.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
					opt.name.toLowerCase().includes(searchQuery.toLowerCase()))
		).slice(0, 24)
	);

	// Debounced Twelve Data symbol search; only apply result when response matches the query we sent (avoids race + async callback state)
	function doStockSearch(q: string) {
		const trimmed = q.trim();
		if (!trimmed || trimmed.length < 2) {
			searchResults = [];
			searchLoading = false;
			return;
		}
		searchLoading = true;
		lastRequestedQuery = trimmed;
		searchSymbols(trimmed)
			.then((res) => {
				if (lastRequestedQuery !== trimmed) return;
				// Deduplicate by symbol because Twelve Data can return the same symbol across exchanges.
				const seen = new Set<string>();
				searchResults = res.filter((r) => {
					const key = r.symbol.toUpperCase();
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
				// Scroll search results into view so they are not hidden below preset list
				requestAnimationFrame(() => searchResultsEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
			})
			.catch(() => {
				if (lastRequestedQuery !== trimmed) return;
				searchResults = [];
				requestAnimationFrame(() => searchResultsEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
			})
			.finally(() => {
				searchLoading = false;
			});
	}

	function onStockSearchInput() {
		if (searchDebounceId) clearTimeout(searchDebounceId);
		const q = stockSearchQuery.trim();
		if (q.length < 2) {
			searchResults = [];
			searchLoading = false;
			return;
		}
		searchLoading = true;
		searchDebounceId = setTimeout(() => {
			doStockSearch(q);
			searchDebounceId = null;
		}, 350);
	}

	function handleAddPreset(symbol: string) {
		if (indicesList.addFromPreset(symbol)) {
			addModalOpen = false;
			searchQuery = '';
			stockSearchQuery = '';
			searchResults = [];
			onIndicesListChange?.();
		}
	}

	function mapSearchSymbol(entry: { symbol: string; name: string; exchange?: string }): string {
		const raw = entry.symbol.trim();
		const exch = entry.exchange?.toUpperCase() ?? '';
		if (/^\d{6}$/.test(raw)) {
			if (raw.startsWith('6')) return `${raw}.SS`;
			if (raw.startsWith('0') || raw.startsWith('3')) return `${raw}.SZ`;
		}
		if (exch.includes('SSE') || exch.includes('SHANGHAI')) return `${raw}.SS`;
		if (exch.includes('SZ') || exch.includes('SHENZHEN')) return `${raw}.SZ`;
		return raw;
	}

	function handleAddSearchResult(entry: { symbol: string; name: string; exchange?: string }) {
		const mappedSymbol = mapSearchSymbol(entry);

		if (indicesList.addIndex({ symbol: mappedSymbol, name: entry.name })) {
			onIndicesListChange?.();
		}
	}

	function handleRemove(symbol: string) {
		indicesList.removeIndex(symbol);
		onIndicesListChange?.();
	}

	function onDragStart(symbol: string, event: DragEvent) {
		draggingSymbol = symbol;
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', symbol);
			event.dataTransfer.setData('text/indices-symbol', symbol);
			event.dataTransfer.setData('text', symbol);
			event.dataTransfer.setData('application/x-indices-symbol', symbol);
			event.dataTransfer.effectAllowed = 'move';
		}
		if (event.dataTransfer?.setDragImage) {
			event.dataTransfer.setDragImage(event.currentTarget as Element, 0, 0);
		}
	}

	function onDragOver(symbol: string, event: DragEvent) {
		event.preventDefault();
		dragOverSymbol = symbol;
	}

	function onDrop(symbol: string, event: DragEvent) {
		event.preventDefault();
		if (!draggingSymbol || draggingSymbol === symbol) return;
		indicesList.moveIndex(draggingSymbol, symbol);
		onIndicesListChange?.();
		draggingSymbol = null;
		dragOverSymbol = null;
	}

	function onDragEnd() {
		draggingSymbol = null;
		dragOverSymbol = null;
		pressedSymbol = null;
	}

	function onPointerDown(symbol: string) {
		pressedSymbol = symbol;
	}

	function onPointerUp(symbol: string) {
		if (pressedSymbol === symbol && draggingSymbol !== symbol) {
			pressedSymbol = null;
		}
	}

	function openAddModal() {
		addModalOpen = true;
		searchQuery = '';
		stockSearchQuery = '';
		searchResults = [];
		lastRequestedQuery = '';
	}
</script>

<Panel id="markets" {title} {count} {loading} {error} {onRetry}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{emptyMarkets}</div>
	{:else}
		<div class="markets-list">
			{#each visibleItems as item (item.symbol)}
				<div
					class={`market-item-row ${dragOverSymbol === item.symbol ? 'drag-over' : ''} ${
						draggingSymbol === item.symbol || pressedSymbol === item.symbol ? 'dragging' : ''
					}`}
					animate:flip={{ duration: 180 }}
					draggable="true"
					role="listitem"
					aria-grabbed={draggingSymbol === item.symbol}
					onpointerdown={() => onPointerDown(item.symbol)}
					onpointerup={() => onPointerUp(item.symbol)}
					onpointerleave={() => onPointerUp(item.symbol)}
					ondragstart={(event) => onDragStart(item.symbol, event)}
					ondragover={(event) => onDragOver(item.symbol, event)}
					ondrop={(event) => onDrop(item.symbol, event)}
					ondragend={onDragEnd}
				>
					<MarketItem {item} />
					{#if selectedList.length > 1}
						<button
							type="button"
							class="remove-btn"
							title={tp.remove}
							aria-label={tp.remove}
							onclick={() => handleRemove(item.symbol)}
						>
							×
						</button>
					{/if}
				</div>
			{/each}
		</div>
		{#if hasMore}
			<button type="button" class="show-more-btn" onclick={() => (expanded = !expanded)}>
				{expanded ? t.showLess : t.showMore}
				{#if !expanded}<span class="show-more-count">({moreCount})</span>{/if}
			</button>
		{/if}
	{/if}

	<div class="markets-footer">
		{#if canAddMore}
			<button
				type="button"
				class="add-more-btn"
				title={tp.addMore}
				onclick={openAddModal}
			>
				+
			</button>
		{:else}
			<span class="max-hint">{tp.maxReached}</span>
		{/if}
	</div>
</Panel>

<Modal
	open={addModalOpen}
	title={tp.modalTitle}
	closeLabel={modalCloseLabel}
	onClose={() => {
		addModalOpen = false;
		searchQuery = '';
		stockSearchQuery = '';
		searchResults = [];
		searchLoading = false;
		lastRequestedQuery = '';
		if (searchDebounceId) {
			clearTimeout(searchDebounceId);
			searchDebounceId = null;
		}
	}}
>
	<div class="add-more-content">
		<p class="section-label">{tp.presetLabel}</p>
		<input
			type="text"
			class="search-input"
			placeholder={tp.searchPlaceholder}
			bind:value={searchQuery}
		/>
		<div class="preset-options">
			{#each presetOptions as opt (opt.symbol)}
				<button
					type="button"
					class="option-btn"
					onclick={() => handleAddPreset(opt.symbol)}
				>
					<span class="opt-symbol">{opt.symbol}</span>
					<span class="opt-name">{opt.name}</span>
				</button>
			{/each}
			{#if presetOptions.length === 0}
				<p class="no-options">{searchQuery ? tp.noMatch : tp.allAdded}</p>
			{/if}
		</div>

		<p class="section-label">{tp.searchLabel}</p>
		<input
			type="text"
			class="search-input"
			placeholder={tp.searchStockPlaceholder}
			bind:value={stockSearchQuery}
			oninput={onStockSearchInput}
		/>
		{#if stockSearchQuery.trim().length >= 2}
			{#if searchLoading}
				<p class="search-status">{tp.searching}</p>
			{:else}
				<div class="search-results-wrapper" bind:this={searchResultsEl}>
					<div class="search-results">
						{#each searchResults as r (r.symbol)}
							{@const mapped = mapSearchSymbol(r)}
							{@const isAdded = selectedSymbolsSet.has(mapped.toUpperCase())}
							<button
								type="button"
								class={`option-btn ${isAdded ? 'option-btn-added' : ''}`}
								onclick={() => (isAdded ? handleRemove(mapped) : handleAddSearchResult(r))}
							>
								<span class="opt-symbol">{r.symbol}</span>
								<span class="opt-name">{r.name}</span>
								<span class={`opt-action ${isAdded ? 'opt-action-remove' : 'opt-action-add'}`}>
									{isAdded ? '×' : '+'}
								</span>
							</button>
						{/each}
						{#if searchResults.length === 0}
							<p class="no-options">{tp.noMatch}</p>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</Modal>

<style>
	.markets-list {
		display: flex;
		flex-direction: column;
	}

	.market-item-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: transform 0.12s ease, opacity 0.12s ease;
		cursor: grab;
	}

	.market-item-row.dragging {
		transform: scale(0.98);
		opacity: 0.8;
		cursor: grabbing;
	}

	.market-item-row.drag-over {
		outline: 1px dashed var(--accent);
		outline-offset: 2px;
		background: rgba(var(--accent-rgb), 0.05);
		border-radius: 4px;
	}

	.market-item-row :global(.market-item) {
		flex: 1;
		min-width: 0;
	}

	.remove-btn {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-muted);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.remove-btn:hover {
		border-color: var(--danger);
		color: var(--danger);
	}

	.show-more-btn {
		margin-top: 0.5rem;
		padding: 0.35rem 0.5rem;
		font-size: 0.65rem;
		color: var(--accent);
		background: none;
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		width: 100%;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.show-more-btn:hover {
		background: rgba(var(--accent-rgb), 0.08);
		border-color: var(--accent);
	}

	.show-more-count {
		color: var(--text-muted);
		font-weight: 500;
		margin-left: 0.25rem;
	}

	.markets-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0 0;
		border-top: 1px solid var(--border);
		margin-top: 0.25rem;
	}

	.add-more-btn {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--accent-rgb), 0.1);
		border: 1px solid var(--accent);
		border-radius: 6px;
		color: var(--accent);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-more-btn:hover {
		background: rgba(var(--accent-rgb), 0.2);
	}

	.max-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}

	.add-more-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin: 0;
		font-weight: 600;
	}

	.search-input {
		padding: 0.5rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.75rem;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.preset-options {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 10rem;
		overflow-y: auto;
	}

	/* Wrapper so results are not covered; min-height keeps area visible when shown */
	.search-results-wrapper {
		position: relative;
		min-height: 6rem;
		flex-shrink: 0;
	}

	.search-results {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 12rem;
		overflow-y: auto;
	}

	.option-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.option-btn:hover {
		background: var(--surface-hover);
		border-color: var(--accent);
	}

	/* 保证代码列固定宽度，名称过长时省略显示，不挤压左右两侧 */
	.option-btn .opt-symbol {
		flex: 0 0 auto;
		min-width: 3.5rem;
	}

	.option-btn .opt-name {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.option-btn-added {
		opacity: 0.9;
	}

	.opt-symbol {
		font-weight: 600;
		color: var(--accent);
		min-width: 3.5rem;
	}

	.opt-name {
		color: var(--text-secondary);
	}

	.opt-action {
		margin-left: auto;
		font-weight: 700;
	}

	.opt-action-add {
		color: var(--accent);
	}

	.opt-action-remove {
		color: var(--danger);
	}

	.no-options,
	.search-status {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin: 0;
		padding: 0.5rem;
	}
</style>
