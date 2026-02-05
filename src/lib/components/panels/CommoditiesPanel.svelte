<script lang="ts">
	import { Panel, MarketItem } from '$lib/components/common';
	import Modal from '$lib/components/modals/Modal.svelte';
	import { commodities, vix, settings, commodityList } from '$lib/stores';
	import { getPanelName, UI_TEXTS, COMMODITY_OPTIONS } from '$lib/config';
	import { searchSymbols } from '$lib/api/twelveData';
	import { flip } from 'svelte/animate';

	interface Props {
		onCommodityListChange?: () => void;
	}

	let { onCommodityListChange }: Props = $props();

	const DEFAULT_PREVIEW = 10;
	let expanded = $state(false);
	let addModalOpen = $state(false);
	let searchQuery = $state('');
	let stockSearchQuery = $state('');
	let searchResults = $state<
		{ symbol: string; name: string; exchange?: string; instrument_type?: string; country?: string }[]
	>([]);
	let searchLoading = $state(false);
	let searchDebounceId = $state<ReturnType<typeof setTimeout> | null>(null);
	let lastRequestedQuery = $state('');
	let searchResultsEl = $state<HTMLDivElement | null>(null);
	let draggingSymbol = $state<string | null>(null);
	let dragOverSymbol = $state<string | null>(null);
	let pressedSymbol = $state<string | null>(null);

	function getCommodityName(symbol: string, locale: 'zh' | 'en'): string {
		return UI_TEXTS[locale].commodities[symbol] ?? symbol;
	}

	const items = $derived($commodities.items);
	const loading = $derived($commodities.loading);
	const error = $derived($commodities.error);
	const selectedList = $derived($commodityList);
	const selectedSymbolsSet = $derived(
		new Set(selectedList.map((i) => i.symbol.toUpperCase()))
	);
	const t = $derived(UI_TEXTS[$settings.locale].commodityPicker);
	const commonT = $derived(UI_TEXTS[$settings.locale].common);
	const modalCloseLabel = $derived(UI_TEXTS[$settings.locale].modal.close);
	const emptyCommodities = $derived(UI_TEXTS[$settings.locale].empty.commodities);
	const visibleItems = $derived(expanded ? items : items.slice(0, DEFAULT_PREVIEW));
	const hasMore = $derived(items.length > DEFAULT_PREVIEW);
	const moreCount = $derived(items.length - DEFAULT_PREVIEW);

	// Preset options filtered by search (symbol/name), excluding already-selected
	const availableOptions = $derived(
		COMMODITY_OPTIONS.filter(
			(opt) =>
				!selectedSymbolsSet.has(opt.symbol.toUpperCase()) &&
				(searchQuery === '' ||
					opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					opt.display.toLowerCase().includes(searchQuery.toLowerCase()))
		).slice(0, 20)
	);

	const canAddMore = $derived(selectedList.length < 15);

	type VixStatusKey = 'highFear' | 'elevated' | 'low';

	function getVixStatusKey(level: number | undefined): VixStatusKey | '' {
		if (level === undefined) return '';
		if (level >= 30) return 'highFear';
		if (level >= 20) return 'elevated';
		return 'low';
	}

	function getVixClass(level: number | undefined): string {
		if (level === undefined) return '';
		if (level >= 30) return 'critical';
		if (level >= 20) return 'elevated';
		return 'monitoring';
	}

	const vixStatusKey = $derived(getVixStatusKey($vix?.price));
	const vixStatus = $derived(vixStatusKey ? UI_TEXTS[$settings.locale].status[vixStatusKey] : '');
	const vixClass = $derived(getVixClass($vix?.price));

	function handleAddPreset(symbol: string) {
		if (commodityList.addFromPreset(symbol)) {
			addModalOpen = false;
			searchQuery = '';
			onCommodityListChange?.();
		}
	}

	function handleRemoveCommodity(symbol: string) {
		commodityList.removeCommodity(symbol);
		onCommodityListChange?.();
	}

	function onDragStart(symbol: string, event: DragEvent) {
		draggingSymbol = symbol;
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', symbol);
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function onDragOver(symbol: string, event: DragEvent) {
		event.preventDefault();
		dragOverSymbol = symbol;
	}

	function onDrop(symbol: string, event: DragEvent) {
		event.preventDefault();
		if (!draggingSymbol || draggingSymbol === symbol) return;
		commodityList.moveCommodity(draggingSymbol, symbol);
		onCommodityListChange?.();
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

	function mapSearchSymbol(entry: { symbol: string; name: string; exchange?: string }): string {
		return entry.symbol.trim();
	}

	// Debounced Twelve Data symbol search for commodities (ETF / futures proxies)
	function doCommoditySearch(q: string) {
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
				const seen = new Set<string>();
				searchResults = res
					// 1) 去重
					.filter((r) => {
						const key = r.symbol.toUpperCase();
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					})
					// 2) 只保留大宗相关（期货 / 商品 ETF 等），尽量过滤个股
					.filter((r) => {
						const type = r.instrument_type?.toLowerCase() ?? '';
						const name = r.name.toLowerCase();
						const sym = r.symbol.toUpperCase();
						const isCommodityKeyword =
							/\bgold\b|\boil\b|\bbrent\b|\bwti\b|\bgas\b|\bnatgas\b|\bwheat\b|\bcorn\b|\bsugar\b|\bsilver\b|\bcopper\b|\bplatinum\b|\bpalladium\b|\bvix\b/.test(
								name
							) ||
							['GC', 'CL', 'NG', 'ZW', 'ZC', 'SB', 'VIX'].some((k) => sym.includes(k));
						const isCommodityInstrument =
							type.includes('etf') ||
							type.includes('fund') ||
							type.includes('index') ||
							type.includes('future');
						return isCommodityKeyword || isCommodityInstrument;
					});
				requestAnimationFrame(() =>
					searchResultsEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
				);
			})
			.catch(() => {
				if (lastRequestedQuery !== trimmed) return;
				searchResults = [];
				requestAnimationFrame(() =>
					searchResultsEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
				);
			})
			.finally(() => {
				searchLoading = false;
			});
	}

	function onCommoditySearchInput() {
		if (searchDebounceId) clearTimeout(searchDebounceId);
		const q = stockSearchQuery.trim();
		if (q.length < 2) {
			searchResults = [];
			searchLoading = false;
			return;
		}
		searchLoading = true;
		searchDebounceId = setTimeout(() => {
			doCommoditySearch(q);
			searchDebounceId = null;
		}, 350);
	}

	function handleAddSearchResult(entry: { symbol: string; name: string; exchange?: string }) {
		const mapped = mapSearchSymbol(entry);
		if (
			commodityList.addCommodity({
				symbol: mapped,
				name: entry.name || entry.symbol
			})
		) {
			onCommodityListChange?.();
		}
	}
</script>

<Panel
	id="commodities"
	title={getPanelName('commodities', $settings.locale)}
	status={vixStatus}
	statusClass={vixClass}
	count={items.length}
	{loading}
	{error}
>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{emptyCommodities}</div>
	{:else}
		<div class="commodities-list">
			{#each visibleItems as item (item.symbol)}
				<div
					class={`commodity-item ${dragOverSymbol === item.symbol ? 'drag-over' : ''} ${
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
					<MarketItem
						{item}
						displayName={item.name}
						currencySymbol={item.symbol === '^VIX' ? '' : '$'}
					/>
					{#if selectedList.length > 1}
						<button
							type="button"
							class="remove-btn"
							title={t.remove}
							aria-label={t.remove}
							onclick={() => handleRemoveCommodity(item.symbol)}
						>
							×
						</button>
					{/if}
				</div>
			{/each}
		</div>
		{#if hasMore}
			<button type="button" class="show-more-btn" onclick={() => (expanded = !expanded)}>
				{expanded ? commonT.showLess : commonT.showMore}
				{#if !expanded}<span class="show-more-count">({moreCount})</span>{/if}
			</button>
		{/if}
	{/if}

	<div class="commodities-footer">
		{#if canAddMore}
			<button
				type="button"
				class="add-commodity-btn"
				title={t.addCommodity}
				onclick={() => (addModalOpen = true)}
			>
				+
			</button>
		{:else}
			<span class="max-hint">{t.maxReached}</span>
		{/if}
	</div>
</Panel>

<Modal
	open={addModalOpen}
	title={t.addCommodityModalTitle}
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
	<div class="add-commodity-content">
		<p class="section-label">{t.presetLabel}</p>
		<input
			type="text"
			class="search-input"
			placeholder={t.searchPlaceholder}
			bind:value={searchQuery}
		/>
		<div class="commodity-options">
			{#each availableOptions as opt (opt.symbol)}
				<button
					type="button"
					class="commodity-option"
					onclick={() => handleAddPreset(opt.symbol)}
				>
					<span class="opt-symbol">{opt.display}</span>
					<span class="opt-name">{getCommodityName(opt.symbol, $settings.locale)}</span>
				</button>
			{/each}
			{#if availableOptions.length === 0}
				<p class="no-options">{searchQuery ? t.noMatch : t.allAdded}</p>
			{/if}
		</div>

		<p class="section-label">{t.searchLabel}</p>
		<input
			type="text"
			class="search-input"
			placeholder={t.searchStockPlaceholder}
			bind:value={stockSearchQuery}
			oninput={onCommoditySearchInput}
		/>
		{#if stockSearchQuery.trim().length >= 2}
			{#if searchLoading}
				<p class="search-status">{t.searching}</p>
			{:else}
				<div class="search-results-wrapper" bind:this={searchResultsEl}>
					<div class="search-results">
						{#each searchResults as r (r.symbol)}
							{@const mapped = mapSearchSymbol(r)}
							{@const isAdded = selectedSymbolsSet.has(mapped.toUpperCase())}
							<button
								type="button"
								class={`option-btn ${isAdded ? 'option-btn-added' : ''}`}
								onclick={() =>
									isAdded ? handleRemoveCommodity(mapped) : handleAddSearchResult(r)}
							>
								<span class="opt-symbol">{r.symbol}</span>
								<span class="opt-name">{r.name}</span>
								<span class={`opt-action ${isAdded ? 'opt-action-remove' : 'opt-action-add'}`}>
									{isAdded ? '×' : '+'}
								</span>
							</button>
						{/each}
						{#if searchResults.length === 0}
							<p class="no-options">{t.noMatch}</p>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</Modal>

<style>
	.commodities-list {
		display: flex;
		flex-direction: column;
	}

	.commodity-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: transform 0.12s ease, opacity 0.12s ease;
		cursor: grab;
	}

	.commodity-item.dragging {
		transform: scale(0.98);
		opacity: 0.8;
		cursor: grabbing;
	}

	.commodity-item.drag-over {
		outline: 1px dashed var(--accent);
		outline-offset: 2px;
		background: rgba(var(--accent-rgb), 0.05);
		border-radius: 4px;
	}

	.commodity-item :global(.market-item) {
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

	.commodities-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0 0;
		border-top: 1px solid var(--border);
		margin-top: 0.25rem;
	}

	.add-commodity-btn {
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

	.add-commodity-btn:hover {
		background: rgba(var(--accent-rgb), 0.2);
	}

	.max-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
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

	.add-commodity-content {
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

	.commodity-options {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 16rem;
		overflow-y: auto;
	}

	.commodity-option {
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

	.commodity-option:hover {
		background: var(--surface-hover);
		border-color: var(--accent);
	}

	.opt-symbol {
		font-weight: 600;
		color: var(--accent);
		min-width: 3rem;
	}

	.opt-name {
		color: var(--text-secondary);
	}

	/* Search results (Twelve Data) */
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

	/* Ensure long names truncate instead of pushing symbol/action */
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

	.search-status {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin: 0;
		padding: 0.5rem;
	}

	.no-options {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin: 0;
		padding: 0.5rem;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
