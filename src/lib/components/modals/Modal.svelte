<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		closeLabel?: string;
		header?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	let {
		open = false,
		title,
		onClose,
		closeLabel = 'Close',
		header,
		footer,
		children
	}: Props = $props();

	let closeButtonRef = $state<HTMLButtonElement | null>(null);
	let previousActive = $state<HTMLElement | null>(null);

	$effect(() => {
		if (open) {
			previousActive = document.activeElement as HTMLElement | null;
			tick().then(() => {
				if (closeButtonRef) closeButtonRef.focus();
			});
		} else {
			if (previousActive && typeof previousActive.focus === 'function') {
				previousActive.focus();
			}
			previousActive = null;
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick}>
		<div class="modal-container" onclick={(e) => e.stopPropagation()}>
			<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
				<!-- Close button inside header so it is never covered by scrollable content -->
				<div class="modal-header">
					<h2 id="modal-title" class="modal-title">{title}</h2>
					{#if header}
						{@render header()}
					{/if}
					<button
						type="button"
						class="modal-close"
						bind:this={closeButtonRef}
						onclick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
						aria-label={closeLabel}>×</button>
				</div>

				<div class="modal-content">
					{@render children()}
				</div>

				{#if footer}
					<div class="modal-footer">
						{@render footer()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	@media (max-width: 360px) {
		.modal-backdrop {
			padding: 0.5rem;
		}
	}

	.modal-container {
		position: relative;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		z-index: 1001;
	}

	.modal {
		position: relative;
		z-index: 0;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		padding-right: 2.5rem;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		background: var(--surface);
	}

	.modal-title {
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
		flex: 1;
		min-width: 0;
	}

	.modal-close {
		position: absolute;
		top: 50%;
		right: 0.5rem;
		transform: translateY(-50%);
		z-index: 10;
		flex-shrink: 0;
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		width: 2rem;
		height: 2rem;
		min-width: 2rem;
		min-height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.modal-close:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	@media (max-width: 360px) {
		.modal-header {
			padding: 0.75rem;
		}
		.modal-content {
			padding: 0.75rem;
		}
	}

	.modal-footer {
		padding: 1rem;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
</style>
