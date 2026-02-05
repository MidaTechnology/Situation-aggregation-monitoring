<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PanelId } from '$lib/config';
	import { settings } from '$lib/stores';
	import { UI_TEXTS } from '$lib/config';

	interface Props {
		id: PanelId;
		title: string;
		count?: number | string | null;
		status?: string;
		statusClass?: string;
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
		draggable?: boolean;
		collapsible?: boolean;
		collapsed?: boolean;
		onCollapse?: () => void;
		header?: Snippet;
		actions?: Snippet;
		children: Snippet;
	}

	let {
		id,
		title,
		count = null,
		status = '',
		statusClass = '',
		loading = false,
		error = null,
		onRetry,
		draggable = true,
		collapsible: collapsibleProp,
		collapsed: collapsedProp,
		onCollapse: onCollapseProp,
		header,
		actions,
		children
	}: Props = $props();

	// Collapse: when user has explicitly toggled, respect stored state; otherwise expand if hasData, collapse if not. All panels get collapse button by default.
	const useStoreCollapse = $derived(collapsibleProp === undefined);
	const collapsible = $derived(collapsibleProp ?? true);
	const hasData = $derived(
		!loading &&
			!error &&
			count != null &&
			(typeof count === 'number' ? count > 0 : String(count).trim().length > 0)
	);
	const storedCollapsed = $derived($settings.panelCollapsed[id] ?? true);
	const userTouchedCollapse = $derived($settings.panelCollapseTouched?.[id] ?? false);
	const collapsed = $derived(
		collapsedProp ??
			(useStoreCollapse
				? userTouchedCollapse
					? storedCollapsed
					: hasData
						? false
						: storedCollapsed
				: false)
	);
	const onCollapse = $derived(onCollapseProp ?? (() => settings.togglePanelCollapse(id)));

	const t = $derived(UI_TEXTS[$settings.locale]);
	const closeLabel = $derived(t.panels.closePanel);
	const isPinned = $derived($settings.pinned.includes(id));
	const pinLabel = $derived(isPinned ? t.panels.unpinPanel : t.panels.pinPanel);

	function handleCollapse() {
		if (collapsible && onCollapse) {
			onCollapse();
		}
	}

	function handleClose() {
		settings.disablePanel(id);
	}

	function handlePin() {
		settings.togglePin(id);
	}
</script>

<div class="panel" class:draggable class:collapsed class:pinned={isPinned} data-panel-id={id}>
	<div class="panel-header">
		<div class="panel-title-row">
			<h3 class="panel-title">{title}</h3>
			{#if count !== null}
				<span class="panel-count">{count}</span>
			{/if}
			{#if status}
				<span class="panel-status {statusClass}">{status}</span>
			{/if}
			{#if loading}
				<span class="panel-loading"></span>
			{/if}
		</div>

		{#if header}
			{@render header()}
		{/if}

		<div class="panel-actions">
			{#if actions}
				{@render actions()}
			{/if}
			<button
				type="button"
				class="panel-pin-btn"
				class:pinned={isPinned}
				aria-label={pinLabel}
				title={pinLabel}
				onclick={handlePin}
			>
				<span class="pin-icon" aria-hidden="true">{isPinned ? '📌' : '📍'}</span>
			</button>
			{#if collapsible}
				<button
					class="panel-collapse-btn"
					onclick={handleCollapse}
					aria-label={t.panels.togglePanel}
				>
					{collapsed ? '▼' : '▲'}
				</button>
			{/if}
			<button
				type="button"
				class="panel-close-btn"
				aria-label={closeLabel}
				title={closeLabel}
				onclick={handleClose}
			>
				×
			</button>
		</div>
	</div>

	<div class="panel-content" class:collapsed aria-hidden={collapsed}>
		<div class="panel-content-inner">
			{#if error}
				<div class="error-msg" role="alert">
					<span>{error}</span>
					{#if onRetry}
						<button type="button" class="retry-btn" onclick={onRetry}>{t.common.retry}</button>
					{/if}
				</div>
			{:else if loading}
				<div class="loading-msg" aria-live="polite">{t.common.loading}</div>
			{:else}
				{@render children()}
			{/if}
		</div>
	</div>
</div>

<style>
	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.panel.pinned {
		border-left: 3px solid var(--danger);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 68, 68, 0.2);
	}

	:global([data-theme='light']) .panel {
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	:global([data-theme='light']) .panel.pinned {
		border-left: 3px solid var(--danger);
		box-shadow:
			0 1px 4px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(255, 68, 68, 0.25);
	}

	.panel.draggable {
		cursor: grab;
	}

	.panel.draggable:active {
		cursor: grabbing;
	}

	.panel.draggable .panel-header {
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: var(--surface);
		border-bottom: 2px solid var(--border);
		min-height: 2rem;
	}

	.panel-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.panel-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}

	.panel-count {
		font-size: 0.65rem;
		font-weight: 500;
		color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}

	.panel-status {
		font-size: 0.6rem;
		font-weight: 600;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.panel-status.monitoring {
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-status.elevated {
		color: #ffa500;
		background: rgba(255, 165, 0, 0.15);
	}

	.panel-status.critical {
		color: #ff4444;
		background: rgba(255, 68, 68, 0.15);
	}

	.panel-loading {
		width: 12px;
		height: 12px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.panel-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.panel-collapse-btn {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem;
		font-size: 0.5rem;
		line-height: 1;
	}

	.panel-collapse-btn:hover {
		color: var(--text-primary);
	}

	.panel-pin-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.25rem;
		font-size: 0.75rem;
		line-height: 1;
		opacity: 0.6;
		transition:
			opacity 0.15s,
			color 0.15s;
	}

	.panel-pin-btn:hover {
		opacity: 1;
		color: var(--text-secondary);
	}

	.panel-pin-btn.pinned {
		opacity: 1;
		color: var(--danger);
	}

	.panel-pin-btn:not(.pinned) .pin-icon {
		opacity: 0.5;
	}

	.pin-icon {
		display: inline-block;
		font-style: normal;
	}

	.panel-close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.15rem 0.35rem;
		font-size: 1rem;
		line-height: 1;
		border-radius: 3px;
		transition:
			color 0.15s ease,
			background 0.15s ease;
	}

	.panel-close-btn:hover {
		color: var(--red);
		background: rgba(255, 68, 68, 0.1);
	}

	/* Smooth collapse: max-height + overflow so height changes gradually and siblings reflow smoothly */
	.panel-content {
		max-height: 2000px;
		overflow: hidden;
		transition: max-height 0.4s cubic-bezier(0.32, 0.72, 0, 1);
	}

	.panel-content.collapsed {
		max-height: 0;
		transition: max-height 0.38s cubic-bezier(0.32, 0.72, 0, 1);
	}

	.panel-content-inner {
		overflow-y: auto;
		padding: 0.5rem;
	}

	.error-msg {
		color: var(--text-secondary);
		text-align: center;
		padding: 1rem;
		font-size: 0.7rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.error-msg span {
		color: var(--danger);
	}

	.retry-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.65rem;
		background: var(--surface-hover);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.retry-btn:hover {
		background: var(--border);
		border-color: var(--accent);
		color: var(--accent);
	}

	.loading-msg {
		color: var(--text-secondary);
		text-align: center;
		padding: 1rem;
		font-size: 0.7rem;
	}
</style>
