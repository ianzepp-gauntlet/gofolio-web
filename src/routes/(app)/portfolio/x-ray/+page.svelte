<script lang="ts">
	import type { PageData } from './$types';
	import Value from '$lib/components/app/Value.svelte';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import XCircle from '@lucide/svelte/icons/x-circle';

	let { data }: { data: PageData } = $props();

	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');

	// Report rules
	let report = $derived(data.report);

	let ruleCategories = $derived.by(() => {
		if (!report?.rules) return [];
		return Object.entries(report.rules).map(([category, rules]) => ({
			category,
			rules: rules ?? []
		}));
	});

	let activeRules = $derived.by(() => {
		return ruleCategories.flatMap((c) => c.rules).filter((r) => r.isActive);
	});

	let fulfilledCount = $derived.by(() => {
		return activeRules.filter((r) => r.value === true).length;
	});

	let totalActiveCount = $derived(activeRules.length);

	let inactiveRules = $derived.by(() => {
		return ruleCategories.flatMap((c) => c.rules).filter((r) => !r.isActive);
	});

	// Asset class breakdown (keep existing analysis)
	let assetClassRows = $derived.by(() => {
		const buckets: Record<string, { value: number; allocation: number }> = {};
		for (const holding of Object.values(data.details?.holdings ?? {})) {
			const key = holding.assetClass ?? 'Unknown';
			const prev = buckets[key] ?? { value: 0, allocation: 0 };
			buckets[key] = {
				value: prev.value + (holding.valueInBaseCurrency ?? 0),
				allocation: prev.allocation + (holding.valueInPercentage ?? 0)
			};
		}
		return Object.entries(buckets)
			.map(([assetClass, values]) => ({ assetClass, ...values }))
			.sort((a, b) => b.allocation - a.allocation);
	});
</script>

<div class="space-y-6">
	<!-- Rules Summary -->
	{#if report}
		<section>
			<div class="flex items-center gap-3 py-2">
				{#if totalActiveCount === 0}
					<span class="text-muted-foreground">No rules configured</span>
				{:else if fulfilledCount === totalActiveCount}
					<CheckCircle class="h-6 w-6 text-green-600" />
					<span class="text-sm font-medium">
						All {totalActiveCount} rules align with your portfolio
					</span>
				{:else}
					<AlertTriangle class="h-6 w-6 text-yellow-600" />
					<span class="text-sm font-medium">
						{fulfilledCount} of {totalActiveCount} rules align with your portfolio
					</span>
				{/if}
			</div>
		</section>

		<!-- Rule Categories -->
		{#each ruleCategories as { category, rules } (category)}
			{@const activeInCategory = rules.filter((r) => r.isActive)}
			{#if activeInCategory.length > 0}
				<section>
					<h3 class="mb-3 text-sm font-medium capitalize">{category.replace(/_/g, ' ')}</h3>
					<div class="space-y-2">
						{#each activeInCategory as rule (rule.key)}
							<div class="flex items-start gap-2 rounded-md p-2 text-sm">
								{#if rule.value === true}
									<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
								{:else if rule.value === false}
									<XCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
								{:else}
									<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
								{/if}
								<span>{rule.name}</span>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/each}

		<!-- Inactive Rules -->
		{#if inactiveRules.length > 0}
			<section>
				<h3 class="text-muted-foreground mb-3 text-sm font-medium">
					Inactive Rules ({inactiveRules.length})
				</h3>
				<div class="space-y-1">
					{#each inactiveRules as rule (rule.key)}
						<div class="text-muted-foreground flex items-center gap-2 p-1 text-sm">
							<span class="h-4 w-4 shrink-0">—</span>
							<span>{rule.name}</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<p class="text-muted-foreground text-sm">Portfolio report not available.</p>
	{/if}

	<!-- Asset Class Breakdown (fallback/supplement) -->
	<section>
		<h3 class="mb-3 text-sm font-medium">Asset Class Breakdown</h3>
		{#if assetClassRows.length === 0}
			<p class="text-muted-foreground text-sm">No holdings data.</p>
		{:else}
			<div class="space-y-2">
				{#each assetClassRows as row (row.assetClass)}
					<div class="space-y-1">
						<div class="flex justify-between text-sm">
							<span>{row.assetClass}</span>
							<span class="text-muted-foreground">
								<Value value={row.value} currency={baseCurrency} />
							</span>
						</div>
						<div class="bg-muted h-2 rounded-full">
							<div
								class="bg-primary h-2 rounded-full"
								style="width: {row.allocation * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
