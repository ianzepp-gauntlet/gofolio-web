<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import Value from './Value.svelte';
	import type { PortfolioPosition } from '$lib/types/api';
	import { ArrowDown, ArrowUp } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		holdings: PortfolioPosition[];
		baseCurrency: string;
		onHoldingClick?: (holding: PortfolioPosition) => void;
		pageSize?: number;
	}

	let { holdings, baseCurrency, onHoldingClick, pageSize = 20 }: Props = $props();

	type SortKey =
		| 'name'
		| 'dateOfFirstActivity'
		| 'quantity'
		| 'value'
		| 'allocation'
		| 'change'
		| 'performance';

	let sortKey = $state<SortKey>('allocation');
	let sortAsc = $state(false);
	let expanded = $state(false);

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = key === 'name';
		}
	}

	function sortValue(holding: PortfolioPosition, key: SortKey): number | string {
		switch (key) {
			case 'name':
				return holding.name?.toLowerCase() ?? '';
			case 'dateOfFirstActivity':
				return holding.dateOfFirstActivity ?? '';
			case 'quantity':
				return holding.quantity ?? 0;
			case 'value':
				return holding.valueInBaseCurrency ?? 0;
			case 'allocation':
				return holding.allocationInPercentage ?? 0;
			case 'change':
				return holding.netPerformanceWithCurrencyEffect ?? 0;
			case 'performance':
				return holding.netPerformancePercentWithCurrencyEffect ?? 0;
		}
	}

	let sorted = $derived.by(() => {
		const list = [...holdings];
		list.sort((a, b) => {
			const va = sortValue(a, sortKey);
			const vb = sortValue(b, sortKey);
			const cmp = va < vb ? -1 : va > vb ? 1 : 0;
			return sortAsc ? cmp : -cmp;
		});
		return list;
	});

	let visible = $derived(expanded ? sorted : sorted.slice(0, pageSize));
	let hasMore = $derived(sorted.length > pageSize && !expanded);
</script>

{#snippet sortHeader(label: string, key: SortKey)}
	<button class="inline-flex items-center gap-1 hover:underline" onclick={() => toggleSort(key)}>
		{label}
		{#if sortKey === key}
			{#if sortAsc}
				<ArrowUp class="h-3 w-3" />
			{:else}
				<ArrowDown class="h-3 w-3" />
			{/if}
		{/if}
	</button>
{/snippet}

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Name</Table.Head>
			<Table.Head class="hidden text-right lg:table-cell"
				>{@render sortHeader('First Activity', 'dateOfFirstActivity')}</Table.Head
			>
			<Table.Head class="hidden text-right lg:table-cell"
				>{@render sortHeader('Quantity', 'quantity')}</Table.Head
			>
			<Table.Head class="hidden text-right lg:table-cell"
				>{@render sortHeader('Value', 'value')}</Table.Head
			>
			<Table.Head class="text-right">{@render sortHeader('Allocation', 'allocation')}</Table.Head>
			<Table.Head class="text-right">{@render sortHeader('Change', 'change')}</Table.Head>
			<Table.Head class="text-right">{@render sortHeader('Performance', 'performance')}</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each visible as holding (holding.dataSource + ':' + holding.symbol)}
			<Table.Row
				class="odd:bg-background even:bg-muted/30 hover:bg-muted/60 cursor-pointer"
				onclick={() => onHoldingClick?.(holding)}
			>
				<Table.Cell class="font-medium">
					<div class="leading-tight">
						<div class="text-foreground truncate">
							{holding.name}
							{#if holding.name === holding.symbol && holding.assetSubClassLabel}
								({holding.assetSubClassLabel})
							{/if}
						</div>
						<div class="text-muted-foreground text-xs">{holding.symbol}</div>
					</div>
				</Table.Cell>
				<Table.Cell class="hidden text-right lg:table-cell">
					{#if holding.dateOfFirstActivity}
						{new Date(holding.dateOfFirstActivity).toLocaleDateString()}
					{/if}
				</Table.Cell>
				<Table.Cell class="hidden text-right lg:table-cell">
					<Value value={holding.quantity} currency={holding.currency} />
				</Table.Cell>
				<Table.Cell class="hidden text-right lg:table-cell">
					<Value value={holding.valueInBaseCurrency} currency={baseCurrency} />
				</Table.Cell>
				<Table.Cell class="text-right">
					<Value value={holding.allocationInPercentage} type="percent" />
				</Table.Cell>
				<Table.Cell class="text-right">
					<Value value={holding.netPerformanceWithCurrencyEffect} currency={baseCurrency} colorized />
				</Table.Cell>
				<Table.Cell class="text-right">
					<Value value={holding.netPerformancePercentWithCurrencyEffect} type="percent" colorized />
				</Table.Cell>
			</Table.Row>
		{:else}
			<Table.Row>
				<Table.Cell colspan={7} class="text-muted-foreground py-8 text-center">
					No holdings found.
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

{#if hasMore}
	<div class="my-3 text-center">
		<Button variant="outline" onclick={() => (expanded = true)}>Show all</Button>
	</div>
{/if}
