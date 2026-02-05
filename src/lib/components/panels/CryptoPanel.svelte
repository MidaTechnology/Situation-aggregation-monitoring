<script lang="ts">
	import { Panel } from '$lib/components/common';
	import Modal from '$lib/components/modals/Modal.svelte';
	import { crypto, cryptoList, settings } from '$lib/stores';
	import { getPanelName, CRYPTO_OPTIONS, UI_TEXTS } from '$lib/config';
	import { formatCurrency, formatPercentChange, getChangeClass } from '$lib/utils';
	import { searchCoins } from '$lib/api/coingecko';
	import { flip } from 'svelte/animate';

	interface Props {
		onCryptoListChange?: () => void;
	}

	let { onCryptoListChange }: Props = $props();

	const DEFAULT_PREVIEW = 10;
	let expanded = $state(false);
	let addModalOpen = $state(false);
	let searchQuery = $state('');
	let coinSearchQuery = $state('');
	let searchResults = $state<{ id: string; symbol: string; name: string }[]>([]);
	let searchLoading = $state(false);
	let searchDebounceId = $state<ReturnType<typeof setTimeout> | null>(null);
	let lastRequestedQuery = $state('');
	let searchResultsEl = $state<HTMLDivElement | null>(null);
	let draggingId = $state<string | null>(null);
	let dragOverId = $state<string | null>(null);
	let pressedId = $state<string | null>(null);

	const items = $derived($crypto.items);
	const loading = $derived($crypto.loading);
	const error = $derived($crypto.error);
	const count = $derived(items.length);
	const title = $derived(getPanelName('crypto', $settings.locale));
	const selectedList = $derived($cryptoList);
	const selectedIdsSet = $derived(new Set(selectedList.map((i) => i.id)));
	const t = $derived(UI_TEXTS[$settings.locale].crypto);
	const commonT = $derived(UI_TEXTS[$settings.locale].common);
	const emptyCrypto = $derived(UI_TEXTS[$settings.locale].empty.crypto);
	const visibleItems = $derived(expanded ? items : items.slice(0, DEFAULT_PREVIEW));
	const hasMore = $derived(items.length > DEFAULT_PREVIEW);
	const moreCount = $derived(items.length - DEFAULT_PREVIEW);

	const availableCoins = $derived(
		CRYPTO_OPTIONS.filter(
			(opt) =>
				!selectedIdsSet.has(opt.id) &&
				(searchQuery === '' ||
					opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					opt.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
		).slice(0, 30)
	);

	const canAddMore = $derived(selectedList.length < 20);

	function handleAddPreset(id: string) {
		if (cryptoList.addFromPreset(id)) {
			addModalOpen = false;
			searchQuery = '';
			onCryptoListChange?.();
		}
	}

	function handleRemoveCoin(id: string) {
		cryptoList.removeCrypto(id);
		onCryptoListChange?.();
	}

	function onDragStart(id: string, event: DragEvent) {
		draggingId = id;
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', id);
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function onDragOver(id: string, event: DragEvent) {
		event.preventDefault();
		dragOverId = id;
	}

	function onDrop(id: string, event: DragEvent) {
		event.preventDefault();
		if (!draggingId || draggingId === id) return;
		cryptoList.moveCrypto(draggingId, id);
		onCryptoListChange?.();
		draggingId = null;
		dragOverId = null;
	}

	function onDragEnd() {
		draggingId = null;
		dragOverId = null;
		pressedId = null;
	}

	function onPointerDown(id: string) {
		pressedId = id;
	}

	function onPointerUp(id: string) {
		if (pressedId === id && draggingId !== id) {
			pressedId = null;
		}
	}

	function doCoinSearch(q: string) {
		const trimmed = q.trim();
		if (!trimmed || trimmed.length < 2) {
			searchResults = [];
			searchLoading = false;
			return;
		}
		searchLoading = true;
		lastRequestedQuery = trimmed;
		searchCoins(trimmed)
			.then((res) => {
				if (lastRequestedQuery !== trimmed) return;
				searchResults = res;
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

	function onCoinSearchInput() {
		if (searchDebounceId) clearTimeout(searchDebounceId);
		const q = coinSearchQuery.trim();
		if (q.length < 2) {
			searchResults = [];
			searchLoading = false;
			return;
		}
		searchLoading = true;
		searchDebounceId = setTimeout(() => {
			doCoinSearch(q);
			searchDebounceId = null;
		}, 350);
	}

	function handleAddSearchResult(entry: { id: string; symbol: string; name: string }) {
		if (cryptoList.addCrypto(entry)) {
			onCryptoListChange?.();
		}
	}
</script>

<Panel id="crypto" {title} {count} {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{emptyCrypto}</div>
	{:else}
		<div class="crypto-list">
			{#each visibleItems as coin (coin.id)}
				{@const changeClass = getChangeClass(coin.price_change_percentage_24h)}
				<div
					class={`crypto-item ${dragOverId === coin.id ? 'drag-over' : ''} ${
						draggingId === coin.id || pressedId === coin.id ? 'dragging' : ''
					}`}
					animate:flip={{ duration: 180 }}
					draggable="true"
					role="listitem"
					aria-grabbed={draggingId === coin.id}
					onpointerdown={() => onPointerDown(coin.id)}
					onpointerup={() => onPointerUp(coin.id)}
					onpointerleave={() => onPointerUp(coin.id)}
					ondragstart={(event) => onDragStart(coin.id, event)}
					ondragover={(event) => onDragOver(coin.id, event)}
					ondrop={(event) => onDrop(coin.id, event)}
					ondragend={onDragEnd}
				>
					<div class="crypto-info">
						<div class="crypto-name">{coin.name}</div>
						<div class="crypto-symbol">{coin.symbol.toUpperCase()}</div>
					</div>
					<div class="crypto-data">
						<div class="crypto-price">{formatCurrency(coin.current_price)}</div>
						<div class="crypto-change {changeClass}">
							{formatPercentChange(coin.price_change_percentage_24h)}
						</div>
					</div>
					{#if selectedList.length > 1}
						<button
							type="button"
							class="remove-btn"
							title={t.remove}
							aria-label={t.remove}
							onclick={() => handleRemoveCoin(coin.id)}
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

	<div class="crypto-footer">
		{#if canAddMore}
			<button
				type="button"
				class="add-coin-btn"
				title={t.addCoin}
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
	title={t.addCoinModalTitle}
	closeLabel={UI_TEXTS[$settings.locale].modal.close}
	onClose={() => {
		addModalOpen = false;
		searchQuery = '';
		coinSearchQuery = '';
		searchResults = [];
		searchLoading = false;
		lastRequestedQuery = '';
		if (searchDebounceId) {
			clearTimeout(searchDebounceId);
			searchDebounceId = null;
		}
	}}
>
	<div class="add-coin-content">
		<p class="section-label">{t.presetLabel}</p>
		<input
			type="text"
			class="search-input"
			placeholder={t.searchPlaceholder}
			bind:value={searchQuery}
		/>
		<div class="coin-options">
			{#each availableCoins as opt (opt.id)}
				<button type="button" class="coin-option" onclick={() => handleAddPreset(opt.id)}>
					<span class="coin-symbol">{opt.symbol}</span>
					<span class="coin-name">{opt.name}</span>
				</button>
			{/each}
			{#if availableCoins.length === 0}
				<p class="no-options">{searchQuery ? t.noMatch : t.allAdded}</p>
			{/if}
		</div>

		<p class="section-label">{t.searchLabel}</p>
		<input
			type="text"
			class="search-input"
			placeholder={t.searchStockPlaceholder}
			bind:value={coinSearchQuery}
			oninput={onCoinSearchInput}
		/>
		{#if coinSearchQuery.trim().length >= 2}
			{#if searchLoading}
				<p class="search-status">{t.searching}</p>
			{:else}
				<div class="search-results-wrapper" bind:this={searchResultsEl}>
					<div class="search-results">
						{#each searchResults as r (r.id)}
							{@const isAdded = selectedIdsSet.has(r.id)}
							<button
								type="button"
								class={`option-btn ${isAdded ? 'option-btn-added' : ''}`}
								onclick={() =>
									isAdded ? handleRemoveCoin(r.id) : handleAddSearchResult(r)}
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
	.crypto-list {
		display: flex;
		flex-direction: column;
	}

	.crypto-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
		gap: 0.5rem;
		transition: transform 0.12s ease, opacity 0.12s ease;
		cursor: grab;
	}

	.crypto-item.dragging {
		transform: scale(0.98);
		opacity: 0.8;
		cursor: grabbing;
	}

	.crypto-item.drag-over {
		outline: 1px dashed var(--accent);
		outline-offset: 2px;
		background: rgba(var(--accent-rgb), 0.05);
		border-radius: 4px;
	}

	.crypto-item.drag-over {
		outline: 1px dashed var(--accent);
		outline-offset: 2px;
		background: rgba(var(--accent-rgb), 0.05);
		border-radius: 4px;
	}

	.crypto-item:last-child {
		border-bottom: none;
	}

	.crypto-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.crypto-name {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.crypto-symbol {
		font-size: 0.55rem;
		color: var(--text-muted);
	}

	.crypto-data {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1rem;
	}

	.crypto-price {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.crypto-change {
		font-size: 0.6rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.crypto-change.up {
		color: var(--success);
	}

	.crypto-change.down {
		color: var(--danger);
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

	.crypto-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0 0;
		border-top: 1px solid var(--border);
		margin-top: 0.25rem;
	}

	.add-coin-btn {
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

	.add-coin-btn:hover {
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

	.add-coin-content {
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

	.coin-options {
		max-height: 240px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.coin-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.coin-option:hover {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.05);
	}

	.coin-symbol {
		font-weight: 600;
		color: var(--accent);
		min-width: 3rem;
	}

	.coin-name {
		color: var(--text-secondary);
	}

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
		text-align: center;
		padding: 1rem;
		margin: 0;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
