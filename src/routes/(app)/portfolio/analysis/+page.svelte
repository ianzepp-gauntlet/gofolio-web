<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Value from '$lib/components/app/Value.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let groupBy = $derived(data.groupBy ?? 'month');
	let isYearly = $derived(groupBy === 'year');

	let perf = $derived(data.performance?.performance ?? null);
	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');

	// Holdings for top/bottom
	let holdings = $derived.by(() => {
		return Object.values(data.details?.holdings ?? {});
	});

	let top3 = $derived.by(() => {
		return [...holdings]
			.filter((h) => h.netPerformancePercentWithCurrencyEffect !== undefined)
			.sort(
				(a, b) =>
					(b.netPerformancePercentWithCurrencyEffect ?? 0) -
					(a.netPerformancePercentWithCurrencyEffect ?? 0)
			)
			.slice(0, 3);
	});

	let bottom3 = $derived.by(() => {
		return [...holdings]
			.filter((h) => h.netPerformancePercentWithCurrencyEffect !== undefined)
			.sort(
				(a, b) =>
					(a.netPerformancePercentWithCurrencyEffect ?? 0) -
					(b.netPerformancePercentWithCurrencyEffect ?? 0)
			)
			.slice(0, 3);
	});

	// Investment totals by month
	let investmentData = $derived(data.investments ?? []);
	let dividendData = $derived(data.dividends ?? []);

	let totalDividends = $derived.by(() => {
		return dividendData.reduce((sum, d) => sum + (d.payment ?? 0), 0);
	});
</script>

<div class="space-y-6">
	<!-- Performance Summary Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Total Investment</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value value={perf?.totalInvestment ?? 0} currency={baseCurrency} />
				</p>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Net Performance</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value
						value={perf?.netPerformanceWithCurrencyEffect ?? 0}
						currency={baseCurrency}
						colorized
					/>
				</p>
				<p class="text-muted-foreground text-xs">
					<Value
						value={(perf?.netPerformancePercentageWithCurrencyEffect ?? 0) / 100}
						type="percent"
						colorized
					/>
				</p>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Current Value</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value value={perf?.currentValueInBaseCurrency ?? 0} currency={baseCurrency} />
				</p>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Annualized Return</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value
						value={(perf?.annualizedPerformancePercent ?? 0) / 100}
						type="percent"
						colorized
					/>
				</p>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Dividends</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value value={totalDividends} currency={baseCurrency} />
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Top & Bottom Holdings -->
	<div class="grid gap-6 lg:grid-cols-2">
		<section>
			<h3 class="mb-3 text-sm font-medium">Top 3 Holdings</h3>
			{#if top3.length === 0}
				<p class="text-muted-foreground text-sm">No holdings data</p>
			{:else}
				<div class="space-y-3">
					{#each top3 as holding, i (holding.symbol)}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span
									class="bg-muted flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
									>{i + 1}</span
								>
								<span class="text-sm">{holding.name}</span>
							</div>
							<span class="text-sm font-medium text-green-600">
								+<Value
									value={(holding.netPerformancePercentWithCurrencyEffect ?? 0) / 100}
									type="percent"
								/>
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section>
			<h3 class="mb-3 text-sm font-medium">Bottom 3 Holdings</h3>
			{#if bottom3.length === 0}
				<p class="text-muted-foreground text-sm">No holdings data</p>
			{:else}
				<div class="space-y-3">
					{#each bottom3 as holding, i (holding.symbol)}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span
									class="bg-muted flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
									>{i + 1}</span
								>
								<span class="text-sm">{holding.name}</span>
							</div>
							<span class="text-sm font-medium text-red-600">
								<Value
									value={(holding.netPerformancePercentWithCurrencyEffect ?? 0) / 100}
									type="percent"
								/>
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>

	<!-- Investment Timeline -->
	{#if investmentData.length > 0}
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-sm font-medium">Investment Timeline</h3>
				<div class="flex gap-1">
					<Button
						variant={isYearly ? 'outline' : 'default'}
						size="sm"
						onclick={() => goto('/portfolio/analysis?groupBy=month')}
					>
						Monthly
					</Button>
					<Button
						variant={isYearly ? 'default' : 'outline'}
						size="sm"
						onclick={() => goto('/portfolio/analysis?groupBy=year')}
					>
						Yearly
					</Button>
				</div>
			</div>
			<div class="overflow-x-auto">
				<table class="gf-table w-full text-sm">
					<thead>
						<tr>
							<th class="px-1 py-2 text-left font-medium">{isYearly ? 'Year' : 'Month'}</th>
							<th class="px-1 py-2 text-right font-medium">Investment</th>
						</tr>
					</thead>
					<tbody>
						{#each investmentData.slice(isYearly ? -20 : -12) as item (item.date)}
							<tr>
								<td class="px-1 py-2 text-xs">
									{isYearly
										? new Date(item.date).getFullYear().toString()
										: new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
								</td>
								<td class="px-1 py-2 text-right">
									<Value value={item.investment} currency={baseCurrency} colorized />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<!-- Dividend Timeline -->
	{#if dividendData.length > 0}
		<section>
			<h3 class="mb-3 text-sm font-medium">Dividend Timeline</h3>
			<div class="overflow-x-auto">
				<table class="gf-table w-full text-sm">
					<thead>
						<tr>
							<th class="px-1 py-2 text-left font-medium">{isYearly ? 'Year' : 'Month'}</th>
							<th class="px-1 py-2 text-right font-medium">Dividend</th>
						</tr>
					</thead>
					<tbody>
						{#each dividendData.slice(isYearly ? -20 : -12) as item (item.date)}
							<tr>
								<td class="px-1 py-2 text-xs">
									{isYearly
										? new Date(item.date).getFullYear().toString()
										: new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
								</td>
								<td class="px-1 py-2 text-right">
									<Value value={item.payment} currency={baseCurrency} />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
