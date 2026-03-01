<script lang="ts">
	import type { PageData } from './$types';
	import type { LayoutData } from '../../$types';
	import PortfolioSummaryView from '$lib/components/app/PortfolioSummaryView.svelte';

	let { data }: { data: PageData & { parent: LayoutData } } = $props();

	let parentData = $derived(data as PageData & LayoutData);
	let baseCurrency = $derived(parentData.info?.baseCurrency ?? 'USD');
</script>

{#if data.summary}
	<PortfolioSummaryView summary={data.summary} {baseCurrency} />
{:else}
	<p class="text-muted-foreground py-8 text-center">No portfolio data available.</p>
{/if}
