<script lang="ts">
	import { isRefreshing, lastRefresh, settings } from '$lib/stores';
	import { UI_TEXTS } from '$lib/config';

	interface Props {
		onSettingsClick?: () => void;
	}

	let { onSettingsClick }: Props = $props();

	const t = $derived(UI_TEXTS[$settings.locale].header);

	const lastRefreshText = $derived(
		$lastRefresh
			? `${t.lastUpdated}${new Date($lastRefresh).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
			: t.neverRefreshed
	);
</script>

<header class="header">
	<div class="header-inner">
		<div class="header-left">
			<h1 class="logo">{t.logo}</h1>
		</div>

		<div class="header-center">
			<div class="refresh-status">
				{#if $isRefreshing}
					<span class="status-text loading" aria-live="polite">{t.refreshing}</span>
				{:else}
					<span class="status-text">{lastRefreshText}</span>
				{/if}
			</div>
		</div>

		<div class="header-right">
			<button class="header-btn settings-btn" onclick={onSettingsClick} title={t.settings}>
				<span class="btn-icon">⚙</span>
				<span class="btn-label">{t.settings}</span>
			</button>
		</div>
	</div>
	{#if $isRefreshing}
		<div
			class="header-progress"
			role="progressbar"
			aria-valuenow={null}
			aria-valuetext="Loading"
			aria-label={t.refreshing}
		></div>
	{/if}
</header>

<style>
	.header {
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		gap: 1rem;
	}

	.header-progress {
		height: 3px;
		background: var(--border);
		overflow: hidden;
	}

	.header-progress::after {
		content: '';
		display: block;
		height: 100%;
		width: 40%;
		background: var(--accent);
		animation: header-progress 1.2s ease-in-out infinite;
	}

	@keyframes header-progress {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(350%);
		}
	}

	.header-left {
		display: flex;
		align-items: baseline;
		flex-shrink: 0;
	}

	.logo {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--text-primary);
		margin: 0;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.header-center {
		display: flex;
		align-items: center;
		flex: 1;
		justify-content: center;
		min-width: 0;
	}

	.refresh-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-text {
		font-size: 0.6rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-text.loading {
		color: var(--accent);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.header-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		min-height: 2.75rem;
		padding: 0.4rem 0.75rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.65rem;
	}

	.header-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	.btn-icon {
		font-size: 0.8rem;
	}

	.btn-label {
		display: none;
	}

	@media (min-width: 768px) {
		.btn-label {
			display: inline;
		}
	}
</style>
