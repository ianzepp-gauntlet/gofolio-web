<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Value from './Value.svelte';
	import type { PortfolioPerformance as PerfData } from '$lib/types/api';

	interface Props {
		performance: PerfData;
		baseCurrency: string;
	}

	let { performance, baseCurrency }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Current Value</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={performance.currentValueInBaseCurrency} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Net Performance</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value
					value={performance.netPerformanceWithCurrencyEffect}
					currency={baseCurrency}
					colorized
				/>
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Net Performance %</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value
					value={performance.netPerformancePercentageWithCurrencyEffect}
					type="percent"
					colorized
				/>
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Total Investment</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={performance.totalInvestment} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>
</div>
