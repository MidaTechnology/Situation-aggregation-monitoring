<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { get } from 'svelte/store';
	import { Header, Dashboard } from '$lib/components/layout';
	import { SettingsModal, MonitorFormModal, OnboardingModal } from '$lib/components/modals';
	import {
		NewsPanel,
		MarketsPanel,
		HeatmapPanel,
		CommoditiesPanel,
		CryptoPanel,
		MainCharPanel,
		CorrelationPanel,
		NarrativePanel,
		MonitorsPanel,
		MapPanel,
		WhalePanel,
		PolymarketPanel,
		ContractsPanel,
		LayoffsPanel,
		IntelPanel,
		SituationPanel,
		WorldLeadersPanel,
		PrinterPanel,
		FedPanel,
		BlockBeatsPanel,
		AIInsightsPanel
	} from '$lib/components/panels';
	import {
		news,
		markets,
		monitors,
		settings,
		refresh,
		cryptoList,
		commodityList,
		indicesList,
		whaleAddresses,
		blockbeats,
		allNewsItems,
		fedIndicators,
		fedNews,
		indices,
		crypto
	} from '$lib/stores';
	import {
		buildAIContext,
		analyzeCorrelations,
		analyzeNarratives,
		calculateMainCharacter
	} from '$lib/analysis';
	import {
		fetchAllNews,
		fetchAllMarkets,
		fetchPolymarket,
		fetchWhaleTransactions,
		fetchWhaleBalances,
		fetchGovContracts,
		fetchLayoffs,
		fetchWorldLeaders,
		fetchFedIndicators,
		fetchFedNews
	} from '$lib/api';
	import type { Prediction, WhaleTransaction, WhaleBalance, Contract, Layoff } from '$lib/api';
	import type { CustomMonitor, WorldLeader } from '$lib/types';
	import {
		getPanelName,
		getSituationConfig,
		NON_DRAGGABLE_PANELS,
		type PanelId
	} from '$lib/config';

	// Modal state
	let settingsOpen = $state(false);
	let monitorFormOpen = $state(false);
	let onboardingOpen = $state(false);
	let editingMonitor = $state<CustomMonitor | null>(null);

	// Misc panel data
	let predictions = $state<Prediction[]>([]);
	let predictionsLoading = $state(false);
	let predictionsError = $state<string | null>(null);
	let whales = $state<WhaleTransaction[]>([]);
	let whaleBalances = $state<WhaleBalance[]>([]);
	let contracts = $state<Contract[]>([]);
	let layoffs = $state<Layoff[]>([]);
	let leaders = $state<WorldLeader[]>([]);
	let leadersLoading = $state(false);
	let aiRefreshTick = $state(0);

	// Data fetching (silent = true: do not set loading state to avoid panel flash)
	async function loadNews(silent = false) {
		const categories = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'] as const;
		if (!silent) categories.forEach((cat) => news.setLoading(cat, true));

		try {
			const data = await fetchAllNews();
			Object.entries(data).forEach(([category, items]) => {
				news.setItems(category as keyof typeof data, items);
			});
		} catch (error) {
			categories.forEach((cat) => news.setError(cat, String(error)));
		}
	}

	async function loadMarkets() {
		try {
			const cryptoCoins = cryptoList.getSelectedConfig();
			const commodityConfigs = commodityList.getSelectedConfig();
			const indicesConfig = indicesList.getSelectedConfig();
			const data = await fetchAllMarkets(cryptoCoins, commodityConfigs, indicesConfig);
			markets.setIndices(data.indices);
			markets.setSectors(data.sectors);
			markets.setCommodities(data.commodities);
			markets.setCrypto(data.crypto);
		} catch (error) {
			console.error('Failed to load markets:', error);
		}
	}

	async function loadMiscData(silent = false) {
		if (!silent) {
			predictionsLoading = true;
			predictionsError = null;
		}
		try {
			const whaleAddrs = whaleAddresses.getAddresses();
			const [predictionsData, whalesData, balancesData, contractsData, layoffsData] =
				await Promise.all([
					fetchPolymarket(),
					fetchWhaleTransactions(whaleAddrs),
					fetchWhaleBalances(whaleAddrs),
					fetchGovContracts(),
					fetchLayoffs()
				]);
			predictions = predictionsData;
			whales = whalesData;
			whaleBalances = balancesData;
			contracts = contractsData;
			layoffs = layoffsData;
		} catch (error) {
			console.error('Failed to load misc data:', error);
			predictionsError = error instanceof Error ? error.message : String(error);
		} finally {
			predictionsLoading = false;
		}
	}

	async function loadWorldLeaders() {
		if (!isPanelVisible('leaders')) return;
		leadersLoading = true;
		try {
			leaders = await fetchWorldLeaders();
		} catch (error) {
			console.error('Failed to load world leaders:', error);
		} finally {
			leadersLoading = false;
		}
	}

	async function loadFedData() {
		if (!isPanelVisible('fed') && !isPanelVisible('printer') && !isPanelVisible('monitors')) return;
		fedIndicators.setLoading(true);
		fedNews.setLoading(true);
		try {
			const [indicatorsData, newsData] = await Promise.all([fetchFedIndicators(), fetchFedNews()]);
			fedIndicators.setData(indicatorsData);
			fedNews.setItems(newsData);
		} catch (error) {
			console.error('Failed to load Fed data:', error);
			fedIndicators.setError(String(error));
			fedNews.setError(String(error));
		}
	}

	// Refresh handlers (silent = true: no loading state so panels don't flash)
	async function loadBlockBeats(silent = false) {
		if (!isPanelVisible('blockbeats')) return;
		await blockbeats.load($settings.locale, silent);
	}

	/** @param silent - true = no global loading bar, no per-panel loading (used for auto-refresh) */
	async function handleRefresh(silent = false) {
		if (!silent) refresh.startRefresh();
		try {
			await Promise.all([
				loadNews(silent),
				loadMarkets(),
				loadMiscData(silent),
				loadBlockBeats(silent),
				loadFedData()
			]);
			if (silent) refresh.updateLastRefresh();
			else refresh.endRefresh();
		} catch (error) {
			if (!silent) refresh.endRefresh([String(error)]);
			// silent refresh on error: still update lastRefresh so next interval is correct
			else refresh.updateLastRefresh();
		} finally {
			aiRefreshTick += 1;
		}
	}

	// Monitor handlers
	function handleCreateMonitor() {
		editingMonitor = null;
		monitorFormOpen = true;
	}

	function handleEditMonitor(monitor: CustomMonitor) {
		editingMonitor = monitor;
		monitorFormOpen = true;
	}

	function handleDeleteMonitor(id: string) {
		monitors.deleteMonitor(id);
	}

	function handleToggleMonitor(id: string) {
		monitors.toggleMonitor(id);
		runMonitorScan();
	}

	// Get panel visibility
	function isPanelVisible(id: PanelId): boolean {
		return $settings.enabled[id] !== false;
	}

	// Display order from settings (persisted; pin moves panel to front in order)
	const displayOrder = $derived($settings.order.filter((id) => $settings.enabled[id]));

	// Map always at top (outside masonry); rest go into masonry
	const mapEnabled = $derived($settings.enabled['map']);
	const displayOrderWithoutMap = $derived(
		displayOrder.filter((id) => id !== 'map') as PanelId[]
	);

	// Masonry: column count from viewport (same breakpoints as layout)
	let numColumns = $state(1);
	function getNumColumns(w: number): number {
		return w >= 2000 ? 6 : w >= 1600 ? 5 : w >= 1280 ? 4 : w >= 960 ? 3 : w >= 768 ? 2 : 1;
	}
	function distribute(order: PanelId[], n: number): PanelId[][] {
		const cols: PanelId[][] = Array.from({ length: n }, () => []);
		order.forEach((id, i) => cols[i % n].push(id));
		return cols;
	}
	const masonryColumns = $derived(distribute(displayOrderWithoutMap, numColumns));

	// AI Insights: aggregate context from enabled panels only
	const aiContext = $derived(
		buildAIContext({
			enabled: $settings.enabled,
			newsItems: $allNewsItems,
			fedItems: $fedNews.items,
			blockbeatsItems: $blockbeats.items ?? [],
			predictions,
			monitorMatches: $monitors.matches.map((m) => ({ item: m.item })),
			correlationResults: analyzeCorrelations($allNewsItems),
			narrativeResults: analyzeNarratives($allNewsItems),
			mainCharacterResults: calculateMainCharacter($allNewsItems),
			indicesSummary:
				$indices.items.length > 0
					? $indices.items
							.slice(0, 3)
							.map(
								(i) =>
									`${i.symbol} ${(i.changePercent ?? 0) >= 0 ? '+' : ''}${(i.changePercent ?? 0).toFixed(2)}%`
							)
							.join(' ')
					: undefined,
			cryptoSummary:
				$crypto.items.length > 0
					? $crypto.items
							.slice(0, 3)
							.map(
								(c) =>
									`${c.symbol?.toUpperCase() ?? c.id} ${(c.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(c.price_change_percentage_24h ?? 0).toFixed(2)}%`
							)
							.join(' ')
					: undefined
		})
	);

	// Drag reorder: long-press on panel header
	let draggingPanelId = $state<PanelId | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function handleDragStart(panelId: PanelId) {
		draggingPanelId = panelId;
		dragOverIndex = displayOrderWithoutMap.indexOf(panelId);
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		if (draggingPanelId === null) return;
		const el = document.elementFromPoint(e.clientX, e.clientY);
		const slotEl = el?.closest('[data-slot-index]');
		if (!slotEl) {
			dragOverIndex = null;
			return;
		}
		const i = parseInt(slotEl.getAttribute('data-slot-index') ?? '0', 10);
		const rect = slotEl.getBoundingClientRect();
		dragOverIndex = e.clientY < rect.top + rect.height / 2 ? i : i + 1;
	}

	function handlePointerUp() {
		if (draggingPanelId === null) return;
		const visibleOrder = [...displayOrderWithoutMap];
		const from = visibleOrder.indexOf(draggingPanelId);
		const to = dragOverIndex ?? from;
		if (from !== -1 && to !== from) {
			visibleOrder.splice(from, 1);
			visibleOrder.splice(Math.min(to, visibleOrder.length), 0, draggingPanelId);
			const fullOrder = $settings.order;
			const disabled = fullOrder.filter((id) => !$settings.enabled[id]);
			const newOrder = (mapEnabled ? (['map'] as PanelId[]) : []).concat(visibleOrder).concat(disabled);
			settings.updateOrder(newOrder);
		}
		draggingPanelId = null;
		dragOverIndex = null;
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
	}

	let longPressTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	function handleSlotPointerDown(panelId: PanelId, e: PointerEvent) {
		if (NON_DRAGGABLE_PANELS.includes(panelId)) return;
		const slot = (e.target as HTMLElement).closest('[data-slot-index]');
		if (!slot) return;
		const header = slot.querySelector('.panel-header');
		if (!header || !header.contains(e.target as Node)) return;
		e.preventDefault();
		longPressTimer = setTimeout(() => {
			longPressTimer = null;
			handleDragStart(panelId);
		}, 400);
	}

	function handleSlotPointerUp() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	// Run monitor keyword scan when source data changes (do not depend on $monitors or effect will loop: scan updates store → $monitors changes → effect runs again)
	$effect(() => {
		const news = $allNewsItems;
		const fed = $fedNews.items;
		const bb = $blockbeats.items ?? [];
		const poly = predictions;
		monitors.scanAllSources(news, fed, bb, poly);
	});

	// Run scan with current data after user saves a monitor (so new/edited monitor takes effect immediately)
	function runMonitorScan() {
		monitors.scanAllSources(
			get(allNewsItems),
			get(fedNews).items,
			get(blockbeats).items ?? [],
			predictions
		);
	}

	// Handle preset selection from onboarding
	function handleSelectPreset(presetId: string) {
		settings.applyPreset(presetId);
		onboardingOpen = false;
		// Refresh data after applying preset
		handleRefresh();
	}

	// Show onboarding again (called from settings)
	function handleReconfigure() {
		settingsOpen = false;
		settings.resetOnboarding();
		onboardingOpen = true;
	}

	// Initial load
	onMount(() => {
		numColumns = getNumColumns(window.innerWidth);
		const onResize = () => (numColumns = getNumColumns(window.innerWidth));
		window.addEventListener('resize', onResize);

		// Check if first visit
		if (!settings.isOnboardingComplete()) {
			onboardingOpen = true;
		}

		// Initial load: show loading bar once
		async function initialLoad() {
			refresh.startRefresh();
			try {
				await Promise.all([
					loadNews(),
					loadMarkets(),
					loadMiscData(),
					loadWorldLeaders(),
					loadFedData(),
					loadBlockBeats()
				]);
				refresh.endRefresh();
			} catch (error) {
				refresh.endRefresh([String(error)]);
			} finally {
				aiRefreshTick += 1;
			}
		}
		initialLoad();
		// Auto-refresh: silent (no global loading bar)
		refresh.setupAutoRefresh(() => handleRefresh(true));

		return () => {
			window.removeEventListener('resize', onResize);
			refresh.stopAutoRefresh();
		};
	});
</script>

<svelte:head>
	<title>Situation Monitor</title>
	<meta name="description" content="Real-time global situation monitoring dashboard" />
</svelte:head>

<div class="app">
	<Header onSettingsClick={() => (settingsOpen = true)} />

	<main class="main-content">
		<Dashboard>
			{#if mapEnabled}
				<div class="map-row">
					<div class="panel-slot map-slot">
						<MapPanel monitors={$monitors.monitors} />
					</div>
				</div>
			{/if}
			<div class="masonry">
				{#each masonryColumns as column, colIndex}
					<div class="masonry-column">
						{#each column as panelId, rowIndex (panelId)}
							{@const i = colIndex + rowIndex * numColumns}
							<div
								class="slot-wrapper"
								role="group"
								aria-label="Panel slot"
								data-slot-index={i}
								data-panel-id={panelId}
								onpointerdown={(e) => handleSlotPointerDown(panelId, e)}
								onpointerup={handleSlotPointerUp}
								onpointerleave={handleSlotPointerUp}
								onpointercancel={handleSlotPointerUp}
								animate:flip={{ duration: 280, easing: (t) => t * (2 - t) }}
							>
					{#if dragOverIndex === i}
						<div class="drop-indicator" aria-hidden="true"></div>
					{/if}
					{#if panelId === 'politics'}
						<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<NewsPanel
							category="politics"
							panelId="politics"
							title={getPanelName('politics', $settings.locale)}
							onRetry={loadNews}
						/>
					</div>
				{:else if panelId === 'tech'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<NewsPanel
							category="tech"
							panelId="tech"
							title={getPanelName('tech', $settings.locale)}
							onRetry={loadNews}
						/>
					</div>
				{:else if panelId === 'finance'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<NewsPanel
							category="finance"
							panelId="finance"
							title={getPanelName('finance', $settings.locale)}
							onRetry={loadNews}
						/>
					</div>
				{:else if panelId === 'gov'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<NewsPanel
							category="gov"
							panelId="gov"
							title={getPanelName('gov', $settings.locale)}
							onRetry={loadNews}
						/>
					</div>
				{:else if panelId === 'ai'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<NewsPanel
							category="ai"
							panelId="ai"
							title={getPanelName('ai', $settings.locale)}
							onRetry={loadNews}
						/>
					</div>
				{:else if panelId === 'markets'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<MarketsPanel onRetry={loadMarkets} onIndicesListChange={loadMarkets} />
					</div>
				{:else if panelId === 'heatmap'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<HeatmapPanel />
					</div>
				{:else if panelId === 'commodities'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<CommoditiesPanel onCommodityListChange={loadMarkets} />
					</div>
				{:else if panelId === 'crypto'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<CryptoPanel onCryptoListChange={loadMarkets} />
					</div>
				{:else if panelId === 'mainchar'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<MainCharPanel />
					</div>
				{:else if panelId === 'correlation'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<CorrelationPanel news={$allNewsItems} />
					</div>
				{:else if panelId === 'narrative'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<NarrativePanel news={$allNewsItems} />
					</div>
				{:else if panelId === 'aiInsights'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<AIInsightsPanel context={aiContext} refreshTick={aiRefreshTick} />
					</div>
				{:else if panelId === 'intel'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<IntelPanel />
					</div>
				{:else if panelId === 'blockbeats'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<BlockBeatsPanel />
					</div>
				{:else if panelId === 'fed'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<FedPanel />
					</div>
				{:else if panelId === 'leaders'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<WorldLeadersPanel {leaders} loading={leadersLoading} />
					</div>
				{:else if panelId === 'venezuela'}
					{@const sc = getSituationConfig('venezuela', $settings.locale)}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<SituationPanel
							panelId="venezuela"
							config={{
								title: sc.title,
								subtitle: sc.subtitle,
								criticalKeywords: ['maduro', 'caracas', 'venezuela', 'guaido']
							}}
							news={$allNewsItems.filter(
								(n) =>
									n.title.toLowerCase().includes('venezuela') ||
									n.title.toLowerCase().includes('maduro')
							)}
						/>
					</div>
				{:else if panelId === 'greenland'}
					{@const sc = getSituationConfig('greenland', $settings.locale)}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<SituationPanel
							panelId="greenland"
							config={{
								title: sc.title,
								subtitle: sc.subtitle,
								criticalKeywords: ['greenland', 'arctic', 'nuuk', 'denmark']
							}}
							news={$allNewsItems.filter(
								(n) =>
									n.title.toLowerCase().includes('greenland') ||
									n.title.toLowerCase().includes('arctic')
							)}
						/>
					</div>
				{:else if panelId === 'iran'}
					{@const sc = getSituationConfig('iran', $settings.locale)}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<SituationPanel
							panelId="iran"
							config={{
								title: sc.title,
								subtitle: sc.subtitle,
								criticalKeywords: [
									'protest',
									'uprising',
									'revolution',
									'crackdown',
									'killed',
									'nuclear',
									'strike',
									'attack',
									'irgc',
									'khamenei'
								]
							}}
							news={$allNewsItems.filter(
								(n) =>
									n.title.toLowerCase().includes('iran') ||
									n.title.toLowerCase().includes('tehran') ||
									n.title.toLowerCase().includes('irgc')
							)}
						/>
					</div>
				{:else if panelId === 'whales'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<WhalePanel {whales} balances={whaleBalances} onWhaleListChange={loadMiscData} />
					</div>
				{:else if panelId === 'polymarket'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<PolymarketPanel
							{predictions}
							loading={predictionsLoading}
							error={predictionsError}
							onRetry={loadMiscData}
						/>
					</div>
				{:else if panelId === 'contracts'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<ContractsPanel {contracts} onRetry={loadMiscData} />
					</div>
				{:else if panelId === 'layoffs'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<LayoffsPanel {layoffs} onRetry={loadMiscData} />
					</div>
				{:else if panelId === 'printer'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<PrinterPanel
							data={$fedIndicators.data?.printer ?? null}
							loading={$fedIndicators.loading}
							error={$fedIndicators.error}
						/>
					</div>
				{:else if panelId === 'monitors'}
					<div class="panel-slot" class:dragging={draggingPanelId === panelId}>
						<MonitorsPanel
							monitors={$monitors.monitors}
							matches={$monitors.matches}
							onCreateMonitor={handleCreateMonitor}
							onEditMonitor={handleEditMonitor}
							onDeleteMonitor={handleDeleteMonitor}
							onToggleMonitor={handleToggleMonitor}
						/>
					</div>
				{/if}
							</div>
						{/each}
					</div>
				{/each}
				{#if dragOverIndex === displayOrder.length}
					<div class="drop-indicator-wrapper masonry-end">
						<div class="drop-indicator drop-indicator-end" aria-hidden="true"></div>
					</div>
				{/if}
			</div>
		</Dashboard>
	</main>

	<!-- Modals -->
	<SettingsModal
		open={settingsOpen}
		onClose={() => (settingsOpen = false)}
		onReconfigure={handleReconfigure}
		onRefreshCallback={() => handleRefresh(true)}
	/>
	<MonitorFormModal
		open={monitorFormOpen}
		onClose={() => (monitorFormOpen = false)}
		onSave={runMonitorScan}
		editMonitor={editingMonitor}
	/>
	<OnboardingModal open={onboardingOpen} onSelectPreset={handleSelectPreset} />
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	.main-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	.map-row {
		width: 100%;
		margin-bottom: 1rem;
	}

	.map-slot {
		width: 100%;
	}

	@media (max-width: 768px) {
		.main-content {
			padding: 0.5rem;
		}
	}
</style>
