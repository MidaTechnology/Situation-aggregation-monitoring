<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Drag-drop state and handlers will be added in Phase 4
	// when panels are fully implemented
</script>

<main class="dashboard">
	<div class="dashboard-grid">
		{@render children()}
	</div>
</main>

<style>
	.dashboard {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
	}

	.dashboard-grid {
		max-width: 2000px;
		margin: 0 auto;
	}

	/* Masonry: columns filled top-to-bottom, each column independent (compact, no cross-column reflow on collapse) */
	.dashboard-grid > :global(.masonry) {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		align-items: flex-start;
	}

	.dashboard-grid > :global(.masonry) > :global(.masonry-column) {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.dashboard-grid > :global(.masonry) > :global(.masonry-end) {
		flex: 1 1 100%;
		width: 100%;
	}
</style>
