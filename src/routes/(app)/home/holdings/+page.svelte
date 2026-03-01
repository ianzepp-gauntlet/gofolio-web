<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import HoldingsTable from '$lib/components/app/HoldingsTable.svelte';
	import Value from '$lib/components/app/Value.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { PortfolioPosition } from '$lib/types/api';
	import type { PageData } from './$types';
	import type { LayoutData } from '../../$types';
	import { Grid2x2, List, X } from '@lucide/svelte';

	interface HoldingDetailResponse {
		SymbolProfile?: {
			name?: string;
			symbol?: string;
		};
		activitiesCount?: number;
		averagePrice?: number;
		marketPrice?: number;
		value?: number;
		quantity?: number;
		netPerformanceWithCurrencyEffect?: number;
		netPerformancePercentWithCurrencyEffect?: number;
		historicalData?: Array<{
			date: string;
			marketPrice?: number;
			value?: number;
		}>;
	}

	let { data }: { data: PageData & LayoutData } = $props();

	let baseCurrency = $derived(data.info?.baseCurrency ?? 'USD');
	let holdingType = $derived<'ACTIVE' | 'CLOSED'>(data.holdingType === 'CLOSED' ? 'CLOSED' : 'ACTIVE');
	let viewMode = $derived<'TABLE' | 'CHART'>(
		($page.url.searchParams.get('viewMode') ?? 'TABLE') === 'CHART' ? 'CHART' : 'TABLE'
	);
	let canUseChart = $derived(data.user.permissions.includes('accessHoldingsChart') && holdingType === 'ACTIVE');
	let canCreateActivity = $derived(
		data.user.permissions.includes('createOrder') && !data.user.settings?.isRestrictedView
	);
	let effectiveViewMode = $derived<'TABLE' | 'CHART'>(canUseChart ? viewMode : 'TABLE');

	let showHoldingDetailDialog = $derived($page.url.searchParams.get('holdingDetailDialog') === 'true');
	let selectedDataSource = $derived($page.url.searchParams.get('dataSource'));
	let selectedSymbol = $derived($page.url.searchParams.get('symbol'));

	let detailLoading = $state(false);
	let detailError = $state<string | null>(null);
	let detailData = $state<HoldingDetailResponse | null>(null);

	let sortedForChart = $derived.by(() =>
		[...data.holdings]
			.filter((holding) => (holding.allocationInPercentage ?? 0) > 0)
			.sort((a, b) => (b.allocationInPercentage ?? 0) - (a.allocationInPercentage ?? 0))
	);

	$effect(() => {
		if (!showHoldingDetailDialog || !selectedDataSource || !selectedSymbol) {
			detailLoading = false;
			detailError = null;
			detailData = null;
			return;
		}

		detailLoading = true;
		detailError = null;

		void fetch(
			`/api/v1/portfolio/holding/${encodeURIComponent(selectedDataSource)}/${encodeURIComponent(selectedSymbol)}`
		)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(await response.text());
				}
				detailData = await response.json();
			})
			.catch(() => {
				detailError = 'Unable to load holding details.';
				detailData = null;
			})
			.finally(() => {
				detailLoading = false;
			});
	});

	function encodeQuery(params: Record<string, string>) {
		return Object.entries(params)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&');
	}

	function openFilters(nextHoldingType: 'ACTIVE' | 'CLOSED', nextViewMode: 'TABLE' | 'CHART' = 'TABLE') {
		const params: Record<string, string> = {
			holdingType: nextHoldingType
		};
		if (nextViewMode === 'CHART' && nextHoldingType === 'ACTIVE') {
			params.viewMode = 'CHART';
		}
		void goto(`/home/holdings?${encodeQuery(params)}`, { keepFocus: true, noScroll: true });
	}

	function setViewMode(nextViewMode: 'TABLE' | 'CHART') {
		openFilters(holdingType, nextViewMode);
	}

	function openHoldingDetail(holding: PortfolioPosition) {
		if (!holding.dataSource || !holding.symbol) {
			return;
		}
		const params: Record<string, string> = {
			holdingType,
			holdingDetailDialog: 'true',
			dataSource: holding.dataSource,
			symbol: holding.symbol
		};
		if (effectiveViewMode === 'CHART') {
			params.viewMode = 'CHART';
		}
		void goto(`/home/holdings?${encodeQuery(params)}`, { keepFocus: true, noScroll: true });
	}

	function closeHoldingDetail() {
		const params: Record<string, string> = {
			holdingType
		};
		if (effectiveViewMode === 'CHART') {
			params.viewMode = 'CHART';
		}
		void goto(`/home/holdings?${encodeQuery(params)}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function symbolInitials(holding: PortfolioPosition) {
		return holding.symbol.slice(0, 2).toUpperCase();
	}
</script>

<div class="space-y-4">
	<h1 class="hidden text-center text-2xl font-semibold sm:block">Holdings</h1>
	<div class="mx-auto w-full max-w-6xl space-y-3">
		<div class="flex items-center justify-between gap-3">
			<div class="hidden items-center gap-1 lg:flex">
				<Button
					variant={effectiveViewMode === 'TABLE' ? 'default' : 'outline'}
					size="icon"
					disabled={!canUseChart}
					onclick={() => setViewMode('TABLE')}
					title="Table"
				>
					<List class="size-4" />
				</Button>
				<Button
					variant={effectiveViewMode === 'CHART' ? 'default' : 'outline'}
					size="icon"
					disabled={!canUseChart}
					onclick={() => setViewMode('CHART')}
					title="Chart"
				>
					<Grid2x2 class="size-4" />
				</Button>
			</div>

			<div class="ml-auto hidden items-center gap-1 lg:flex">
				<Button
					variant={holdingType === 'ACTIVE' ? 'default' : 'outline'}
					size="sm"
					onclick={() => openFilters('ACTIVE', effectiveViewMode)}
				>
					Active
				</Button>
				<Button
					variant={holdingType === 'CLOSED' ? 'default' : 'outline'}
					size="sm"
					onclick={() => openFilters('CLOSED')}
				>
					Closed
				</Button>
			</div>
		</div>

		{#if effectiveViewMode === 'CHART'}
			<div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each sortedForChart as holding (holding.dataSource + ':' + holding.symbol)}
					<button
						type="button"
						class="bg-muted/40 hover:bg-muted/60 border-border relative min-h-24 rounded-md border p-3 text-left transition-colors"
						style="min-height: {Math.max(96, Math.round((holding.allocationInPercentage ?? 0) * 3.2))}px"
						onclick={() => openHoldingDetail(holding)}
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<div class="truncate text-sm font-semibold">{holding.name}</div>
								<div class="text-muted-foreground text-xs">{holding.symbol}</div>
							</div>
							<div class="bg-background/80 rounded px-1.5 py-0.5 text-[10px] font-medium">
								{symbolInitials(holding)}
							</div>
						</div>
						<div class="mt-3">
							<Value value={holding.allocationInPercentage} type="percent" />
						</div>
					</button>
				{:else}
					<div class="text-muted-foreground col-span-full rounded-md border py-8 text-center text-sm">
						No holdings available for chart view.
					</div>
				{/each}
			</div>
		{:else}
			<HoldingsTable holdings={data.holdings} {baseCurrency} onHoldingClick={openHoldingDetail} />
			{#if canCreateActivity && data.holdings.length > 0}
				<div class="text-center">
					<a class="mt-3 inline-flex" href="/portfolio/activities">
						<Button variant="outline">Manage Activities</Button>
					</a>
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if showHoldingDetailDialog && selectedDataSource && selectedSymbol}
	<div class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
		<div class="bg-background border-border w-full max-w-2xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">
					{detailData?.SymbolProfile?.name ?? detailData?.SymbolProfile?.symbol ?? selectedSymbol}
				</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeHoldingDetail}>
					<X class="size-4" />
				</Button>
			</div>
			{#if detailLoading}
				<p class="text-muted-foreground py-8 text-center text-sm">Loading holding details...</p>
			{:else if detailError}
				<p class="text-destructive py-8 text-center text-sm">{detailError}</p>
			{:else if detailData}
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Quantity</div>
						<div class="text-sm font-medium">{detailData.quantity ?? '-'}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Average Price</div>
						<div class="text-sm font-medium">
							<Value value={detailData.averagePrice} currency={baseCurrency} />
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Market Price</div>
						<div class="text-sm font-medium">
							<Value value={detailData.marketPrice} currency={baseCurrency} />
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Value</div>
						<div class="text-sm font-medium">
							<Value value={detailData.value} currency={baseCurrency} />
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Net Performance</div>
						<div class="text-sm font-medium">
							<Value
								value={detailData.netPerformanceWithCurrencyEffect}
								currency={baseCurrency}
								colorized
							/>
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Performance</div>
						<div class="text-sm font-medium">
							<Value value={detailData.netPerformancePercentWithCurrencyEffect} type="percent" colorized />
						</div>
					</div>
				</div>
			{:else}
				<p class="text-muted-foreground py-8 text-center text-sm">No holding details available.</p>
			{/if}
			<div class="mt-4 flex justify-end">
				<Button type="button" onclick={closeHoldingDetail}>Close</Button>
			</div>
		</div>
	</div>
{/if}
