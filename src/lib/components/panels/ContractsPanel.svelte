<script lang="ts">
	import { Panel } from '$lib/components/common';
	import { settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';

	interface Contract {
		agency: string;
		description: string;
		vendor: string;
		amount: number;
		url?: string;
	}

	interface Props {
		contracts?: Contract[];
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
	}

	let { contracts = [], loading = false, error = null, onRetry }: Props = $props();
	let expanded = $state(false);

	const DEFAULT_PREVIEW = 5;
	const count = $derived(contracts.length);
	const title = $derived(getPanelName('contracts', $settings.locale));
	const emptyContracts = $derived(UI_TEXTS[$settings.locale].empty.contracts);
	const t = $derived(UI_TEXTS[$settings.locale].common);
	const contractT = $derived(UI_TEXTS[$settings.locale].contracts);
	const visibleList = $derived(expanded ? contracts : contracts.slice(0, DEFAULT_PREVIEW));
	const hasMore = $derived(contracts.length > DEFAULT_PREVIEW);
	const moreCount = $derived(contracts.length - DEFAULT_PREVIEW);

	function formatValue(v: number): string {
		if ($settings.locale === 'zh') {
			if (v >= 1e9) return '$' + (v / 1e8).toFixed(1) + contractT.billion;
			if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + contractT.million;
			if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + contractT.thousand;
			return '$' + v.toFixed(0);
		}
		if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + contractT.billion;
		if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + contractT.million;
		if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + contractT.thousand;
		return '$' + v.toFixed(0);
	}
</script>

<Panel id="contracts" {title} {count} {loading} {error} {onRetry}>
	{#if contracts.length === 0 && !loading && !error}
		<div class="empty-state">{emptyContracts}</div>
	{:else}
		<div class="contracts-list">
			{#each visibleList as contract, i (contract.vendor + (contract.url ?? '') + i)}
				{#if contract.url}
					<a
						href={contract.url}
						target="_blank"
						rel="noopener noreferrer"
						class="contract-item contract-link"
					>
						<div class="contract-agency">{contract.agency}</div>
						<div class="contract-desc">
							{contract.description.length > 100
								? contract.description.substring(0, 100) + '...'
								: contract.description}
						</div>
						<div class="contract-meta">
							<span class="contract-vendor">{contract.vendor}</span>
							<span class="contract-value">{formatValue(contract.amount)}</span>
						</div>
					</a>
				{:else}
					<div class="contract-item">
						<div class="contract-agency">{contract.agency}</div>
						<div class="contract-desc">
							{contract.description.length > 100
								? contract.description.substring(0, 100) + '...'
								: contract.description}
						</div>
						<div class="contract-meta">
							<span class="contract-vendor">{contract.vendor}</span>
							<span class="contract-value">{formatValue(contract.amount)}</span>
						</div>
					</div>
				{/if}
			{/each}
		</div>
		{#if hasMore}
			<button type="button" class="show-more-btn" onclick={() => (expanded = !expanded)}>
				{expanded ? t.showLess : t.showMore}
				{#if !expanded}<span class="show-more-count">({moreCount})</span>{/if}
			</button>
		{/if}
	{/if}
</Panel>

<style>
	.contracts-list {
		display: flex;
		flex-direction: column;
	}

	.contract-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.contract-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.contract-link:hover {
		background: var(--bg-hover, rgba(255, 255, 255, 0.04));
		border-radius: 4px;
		margin: 0 -0.25rem;
		padding-left: 0.25rem;
		padding-right: 0.25rem;
	}

	.contract-item:last-child {
		border-bottom: none;
	}

	.contract-agency {
		font-size: 0.55rem;
		font-weight: 600;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-bottom: 0.2rem;
	}

	.contract-desc {
		font-size: 0.65rem;
		color: var(--text-primary);
		line-height: 1.3;
		margin-bottom: 0.3rem;
	}

	.contract-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.contract-vendor {
		font-size: 0.55rem;
		color: var(--text-secondary);
	}

	.contract-value {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--success);
		font-variant-numeric: tabular-nums;
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

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
