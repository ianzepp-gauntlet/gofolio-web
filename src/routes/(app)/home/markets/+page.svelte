<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Value from '$lib/components/app/Value.svelte';
	import EntityLogo from '$lib/components/app/EntityLogo.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import type { BenchmarkTrend, MarketCondition } from '$lib/types/api';
	import type { PageData } from './$types';
	import { Minus, TrendingDown, TrendingUp, X } from '@lucide/svelte';

	type BenchmarkItem = PageData['benchmarks'][number];

	interface AssetResponse {
		assetProfile?: {
			name?: string;
			symbol?: string;
		};
		marketData?: Array<{
			date: string;
			marketPrice: number;
		}>;
	}

	let { data }: { data: PageData } = $props();

	const fearAndGreedMode = 'STOCKS';
	let fearAndGreedCurrent = $derived(data.fearAndGreed?.[fearAndGreedMode]?.marketPrice ?? null);
	let fearAndGreedHistory = $derived(data.fearAndGreed?.[fearAndGreedMode]?.historicalData ?? []);
	let fearAndGreedLabels = $derived(fearAndGreedHistory.map((item) => item.date));
	let fearAndGreedValues = $derived(fearAndGreedHistory.map((item) => item.marketPrice));
	let fearAndGreedStateView = $derived(fearGreedState(fearAndGreedCurrent));

	let showDetailDialog = $derived($page.url.searchParams.get('benchmarkDetailDialog') === 'true');
	let selectedDataSource = $derived($page.url.searchParams.get('dataSource'));
	let selectedSymbol = $derived($page.url.searchParams.get('symbol'));
	let selectedItem = $derived.by(() =>
		selectedDataSource && selectedSymbol
			? data.benchmarks.find(
					(item) => item.dataSource === selectedDataSource && item.symbol === selectedSymbol
				)
			: undefined
	);

	let detailLoading = $state(false);
	let detailError = $state<string | null>(null);
	let detailName = $state<string | null>(null);
	let detailValue = $state<number | null>(null);
	let detailLabels = $state<string[]>([]);
	let detailData = $state<(number | null)[]>([]);

	$effect(() => {
		if (!showDetailDialog || !selectedDataSource || !selectedSymbol) {
			detailLoading = false;
			detailError = null;
			detailName = null;
			detailValue = null;
			detailLabels = [];
			detailData = [];
			return;
		}

		detailLoading = true;
		detailError = null;

		void fetch(`/api/v1/asset/${encodeURIComponent(selectedDataSource)}/${encodeURIComponent(selectedSymbol)}`)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(await response.text());
				}
				const asset: AssetResponse = await response.json();
				const points = (asset.marketData ?? []).map((point) => ({
					date: point.date,
					value: point.marketPrice
				}));

				detailName = asset.assetProfile?.name ?? asset.assetProfile?.symbol ?? selectedSymbol;
				detailValue = points.length > 0 ? points[points.length - 1].value : null;
				detailLabels = points.map((point) => point.date);
				detailData = points.map((point) => point.value);
			})
			.catch(() => {
				detailError = 'Unable to load benchmark details.';
				detailName = selectedSymbol;
				detailValue = null;
				detailLabels = [];
				detailData = [];
			})
			.finally(() => {
				detailLoading = false;
			});
	});

	function trendIcon(trend: BenchmarkTrend) {
		if (trend === 'UP') return TrendingUp;
		if (trend === 'DOWN') return TrendingDown;
		return Minus;
	}

	function trendColor(trend: BenchmarkTrend) {
		if (trend === 'UP') return 'text-green-600 dark:text-green-400';
		if (trend === 'DOWN') return 'text-red-600 dark:text-red-400';
		return 'text-muted-foreground';
	}

	function conditionEmoji(condition: MarketCondition) {
		if (condition === 'ALL_TIME_HIGH') return '🚀';
		if (condition === 'BEAR_MARKET') return '🐻';
		return '😐';
	}

	function openDetailDialog(item: BenchmarkItem) {
		void goto(
			`/home/markets?benchmarkDetailDialog=true&dataSource=${encodeURIComponent(item.dataSource)}&symbol=${encodeURIComponent(item.symbol)}`,
			{ keepFocus: true, noScroll: true }
		);
	}

	function closeDialogs() {
		void goto('/home/markets', { replaceState: true, keepFocus: true, noScroll: true });
	}

	function fearGreedState(index: number | null): { emoji: string; text: string } {
		if (index === null || !Number.isFinite(index)) {
			return { emoji: '😐', text: 'Unavailable' };
		}
		if (index <= 24) return { emoji: '😨', text: 'Extreme Fear' };
		if (index <= 44) return { emoji: '😟', text: 'Fear' };
		if (index <= 55) return { emoji: '😐', text: 'Neutral' };
		if (index <= 74) return { emoji: '🙂', text: 'Greed' };
		return { emoji: '🤑', text: 'Extreme Greed' };
	}
</script>

<div class="space-y-4">
	<h1 class="hidden text-center text-2xl font-semibold sm:block">Markets</h1>
	<div class="mx-auto w-full max-w-5xl space-y-5">
		{#if data.hasFearAndGreedPermission}
			<div class="rounded-lg border p-4 sm:p-5">
				<div class="text-muted-foreground mb-3 text-center text-xs">Last {data.fearAndGreedDays} Days</div>
				{#if fearAndGreedLabels.length > 0}
					<LineChart labels={fearAndGreedLabels} data={fearAndGreedValues} yLabel="Fear & Greed Index" />
				{:else}
					<p class="text-muted-foreground py-6 text-center text-sm">No fear & greed data available.</p>
				{/if}

				<div class="mt-4 text-center">
					<div class="text-2xl">{fearAndGreedStateView.emoji}</div>
					<div class="text-base font-medium">
						{fearAndGreedStateView.text}
						{#if fearAndGreedCurrent !== null}
							<span class="text-muted-foreground ml-1 text-sm">
								<strong>{Math.round(fearAndGreedCurrent)}</strong>/100
							</span>
						{/if}
					</div>
					<div class="text-muted-foreground text-xs">Current Market Mood</div>
				</div>
			</div>
		{:else}
			<div class="bg-muted/30 text-muted-foreground rounded-lg border p-4 text-sm">
				Fear & Greed Index is unavailable for this account.
			</div>
		{/if}

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="sticky left-0 z-20 bg-background">Benchmark</Table.Head>
					<Table.Head class="text-center">50d</Table.Head>
					<Table.Head class="text-center">200d</Table.Head>
					<Table.Head class="text-right">From ATH</Table.Head>
					<Table.Head class="text-center">Market</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.benchmarks as benchmark (benchmark.dataSource + ':' + benchmark.symbol)}
					{@const Icon50 = trendIcon(benchmark.trend50d)}
					{@const Icon200 = trendIcon(benchmark.trend200d)}
					<Table.Row
						class="odd:bg-background even:bg-muted/30 hover:bg-muted/60 cursor-pointer"
						onclick={() => openDetailDialog(benchmark)}
					>
						<Table.Cell class="sticky left-0 z-10 bg-background font-medium">
							<div class="flex items-start gap-2 leading-tight">
								<EntityLogo
									dataSource={benchmark.dataSource}
									symbol={benchmark.symbol}
									name={benchmark.name}
									size={18}
								/>
								<div class="min-w-0">
									<div class="text-foreground truncate">{benchmark.name}</div>
								</div>
							</div>
						</Table.Cell>
						<Table.Cell class="text-center">
							{#if benchmark.trend50d !== 'UNKNOWN'}
								<Icon50 class="mx-auto h-4 w-4 {trendColor(benchmark.trend50d)}" />
							{/if}
						</Table.Cell>
						<Table.Cell class="text-center">
							{#if benchmark.trend200d !== 'UNKNOWN'}
								<Icon200 class="mx-auto h-4 w-4 {trendColor(benchmark.trend200d)}" />
							{/if}
						</Table.Cell>
						<Table.Cell class="text-right">
							<Value
								value={benchmark.performances.allTimeHigh.performancePercent}
								type="percent"
								colorized
							/>
						</Table.Cell>
						<Table.Cell class="text-center">{conditionEmoji(benchmark.marketCondition)}</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="text-muted-foreground py-8 text-center">
							No benchmarks configured.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		{#if data.benchmarks.length > 0}
			<p class="text-muted-foreground text-center text-xs">
				Calculations are based on delayed market data and may not be displayed in real time.
			</p>
		{/if}
	</div>
</div>

{#if showDetailDialog && selectedDataSource && selectedSymbol}
	<div class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
		<div class="bg-background border-border w-full max-w-3xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">{detailName ?? selectedItem?.name ?? selectedSymbol}</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>
			{#if detailLoading}
				<p class="text-muted-foreground py-8 text-center text-sm">Loading benchmark details...</p>
			{:else if detailError}
				<p class="text-destructive py-8 text-center text-sm">{detailError}</p>
			{:else}
				{#if detailValue !== null}
					<div class="mb-4 text-center">
						<Value value={detailValue} />
					</div>
				{/if}
				{#if detailLabels.length > 0}
					<LineChart labels={detailLabels} data={detailData} yLabel="Average Unit Price" />
				{:else}
					<p class="text-muted-foreground py-8 text-center text-sm">No historical data available.</p>
				{/if}
			{/if}
			<div class="mt-4 flex justify-end">
				<Button type="button" onclick={closeDialogs}>Close</Button>
			</div>
		</div>
	</div>
{/if}
