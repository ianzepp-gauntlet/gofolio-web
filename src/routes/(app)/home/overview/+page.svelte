<script lang="ts">
	import type { PageData } from './$types';
	import type { LayoutData } from '../../$types';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import PortfolioPerformance from '$lib/components/app/PortfolioPerformance.svelte';
	import * as Card from '$lib/components/ui/card';

	let { data }: { data: PageData & { parent: LayoutData } } = $props();

	let parentData = $derived(data as PageData & LayoutData);
	let baseCurrency = $derived(parentData.info?.baseCurrency ?? 'USD');

	let chartLabels = $derived((data.chart ?? []).map((d) => d.date));
	let chartData = $derived(
		(data.chart ?? []).map((d) => d.netPerformanceInPercentageWithCurrencyEffect ?? null)
	);
</script>

{#if data.performance}
	<div class="space-y-6">
		<PortfolioPerformance performance={data.performance} {baseCurrency} />

		{#if chartLabels.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title>Performance</Card.Title>
				</Card.Header>
				<Card.Content>
					<LineChart labels={chartLabels} data={chartData} yLabel="%" />
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-16 text-center">
		<h2 class="text-xl font-semibold">Welcome to Gofolio</h2>
		<p class="text-muted-foreground mt-2 max-w-md">
			Add your first activity to start tracking your portfolio performance.
		</p>
	</div>
{/if}
