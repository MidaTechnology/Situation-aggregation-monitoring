<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores';
	import '../app.css';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		document.documentElement.setAttribute('data-theme', $settings.theme);
	});
</script>

<div class="min-h-screen theme-bg">
	{@render children()}
</div>
