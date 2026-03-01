<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Value from '$lib/components/app/Value.svelte';
	import EntityLogo from '$lib/components/app/EntityLogo.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import type { BenchmarkTrend, MarketCondition } from '$lib/types/api';
	import type { ActionData, PageData } from './$types';
	import { Ellipsis, Minus, Plus, Trash2, TrendingDown, TrendingUp, X } from '@lucide/svelte';

	type WatchlistItem = PageData['watchlist'][number];

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

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let canCreateWatchlistItem = $derived(
		data.user.permissions.includes('createWatchlistItem') && !data.user.settings?.isRestrictedView
	);
	let canDeleteWatchlistItem = $derived(
		data.user.permissions.includes('deleteWatchlistItem') && !data.user.settings?.isRestrictedView
	);

	let showCreateDialog = $derived($page.url.searchParams.get('createWatchlistItemDialog') === 'true');
	let showDeleteDialog = $derived($page.url.searchParams.get('deleteDialog') === 'true');
	let showDetailDialog = $derived($page.url.searchParams.get('benchmarkDetailDialog') === 'true');
	let selectedDataSource = $derived($page.url.searchParams.get('dataSource'));
	let selectedSymbol = $derived($page.url.searchParams.get('symbol'));
	let selectedItem = $derived.by(() =>
		selectedDataSource && selectedSymbol
			? data.watchlist.find(
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

	function openQuery(params: Record<string, string>) {
		const query = Object.entries(params)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&');
		void goto(`/home/watchlist?${query}`, { keepFocus: true, noScroll: true });
	}

	function closeDialogs() {
		void goto('/home/watchlist', { replaceState: true, keepFocus: true, noScroll: true });
	}

	function openCreateDialog() {
		openQuery({ createWatchlistItemDialog: 'true' });
	}

	function openDetailDialog(item: WatchlistItem) {
		openQuery({
			benchmarkDetailDialog: 'true',
			dataSource: item.dataSource,
			symbol: item.symbol
		});
	}

	function openDeleteDialog(item: WatchlistItem) {
		openQuery({
			deleteDialog: 'true',
			dataSource: item.dataSource,
			symbol: item.symbol
		});
	}
</script>

<div class="space-y-4">
	<h1 class="hidden text-center text-2xl font-semibold sm:block">Watchlist</h1>
	<div class="mx-auto w-full max-w-5xl">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="sticky left-0 z-20 bg-background">Name</Table.Head>
					<Table.Head class="text-center">50d</Table.Head>
					<Table.Head class="text-center">200d</Table.Head>
					<Table.Head class="text-right">From ATH</Table.Head>
					<Table.Head class="text-center">Market</Table.Head>
					{#if canDeleteWatchlistItem}
						<Table.Head class="sticky right-0 z-20 w-12 bg-background text-center"></Table.Head>
					{/if}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.watchlist as item (item.dataSource + ':' + item.symbol)}
					{@const Icon50 = trendIcon(item.trend50d)}
					{@const Icon200 = trendIcon(item.trend200d)}
					<Table.Row
						class="cursor-pointer"
						onclick={() => openDetailDialog(item)}
					>
						<Table.Cell class="sticky left-0 z-10 bg-background font-medium">
							<div class="flex items-start gap-2 leading-tight">
								<EntityLogo
									dataSource={item.dataSource}
									symbol={item.symbol}
									name={item.name}
									size={18}
								/>
								<div class="min-w-0">
								<div class="text-foreground truncate">{item.name}</div>
								<div class="text-muted-foreground text-xs">{item.symbol}</div>
								</div>
							</div>
						</Table.Cell>
						<Table.Cell class="text-center">
							{#if item.trend50d !== 'UNKNOWN'}
								<Icon50 class="mx-auto h-4 w-4 {trendColor(item.trend50d)}" />
							{/if}
						</Table.Cell>
						<Table.Cell class="text-center">
							{#if item.trend200d !== 'UNKNOWN'}
								<Icon200 class="mx-auto h-4 w-4 {trendColor(item.trend200d)}" />
							{/if}
						</Table.Cell>
						<Table.Cell class="text-right">
							<Value value={item.performances.allTimeHigh.performancePercent} type="percent" colorized />
						</Table.Cell>
						<Table.Cell class="text-center">{conditionEmoji(item.marketCondition)}</Table.Cell>
						{#if canDeleteWatchlistItem}
							<Table.Cell
								class="sticky right-0 z-10 bg-background text-center"
								onclick={(event) => event.stopPropagation()}
							>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md"
									>
										<Ellipsis class="size-4" />
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-36">
										<DropdownMenu.Item
											variant="destructive"
											onclick={() => openDeleteDialog(item)}
										>
											<Trash2 class="size-4" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						{/if}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={canDeleteWatchlistItem ? 6 : 5} class="text-muted-foreground py-8 text-center">
							No watchlist items. Add symbols to your watchlist to track them here.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>

{#if canCreateWatchlistItem}
	<div class="fixed right-6 bottom-6 z-40">
		<Button size="icon-lg" class="rounded-full shadow-lg" onclick={openCreateDialog}>
			<Plus class="size-5" />
			<span class="sr-only">Add asset to watchlist</span>
		</Button>
	</div>
{/if}

{#if showCreateDialog}
	<div class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
		<div class="bg-background border-border w-full max-w-lg rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Add asset to watchlist</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>
			<form method="POST" action="?/create" class="space-y-4">
				<div class="space-y-2">
					<Label for="watchlistDataSource">Data Source</Label>
					<Input id="watchlistDataSource" name="dataSource" placeholder="e.g. YAHOO" required />
				</div>
				<div class="space-y-2">
					<Label for="watchlistSymbol">Symbol</Label>
					<Input id="watchlistSymbol" name="symbol" placeholder="e.g. VTI" required />
				</div>
				{#if form?.action === 'create' && form?.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}
				<div class="flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={closeDialogs}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showDeleteDialog && selectedDataSource && selectedSymbol}
	<div class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
		<div class="bg-background border-border w-full max-w-md rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Delete watchlist item</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>
			<p class="text-muted-foreground mb-4 text-sm">
				Delete <span class="text-foreground font-medium">{selectedSymbol}</span> from watchlist?
			</p>
			<form method="POST" action="?/delete" class="space-y-4">
				<input type="hidden" name="dataSource" value={selectedDataSource} />
				<input type="hidden" name="symbol" value={selectedSymbol} />
				{#if form?.action === 'delete' && form?.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}
				<div class="flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={closeDialogs}>Cancel</Button>
					<Button type="submit" variant="destructive">Delete</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

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
