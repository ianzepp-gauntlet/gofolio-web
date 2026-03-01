<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import Value from '$lib/components/app/Value.svelte';

	let { data }: { data: PageData } = $props();
	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');

	// Accounts allocation
	let accountRows = $derived.by(() => {
		const entries = Object.entries(data.details?.accounts ?? {});
		return entries
			.map(([id, account]) => ({ id, ...account }))
			.sort((a, b) => (b.valueInPercentage ?? 0) - (a.valueInPercentage ?? 0));
	});

	// Holdings for breakdown calculations
	let holdings = $derived.by(() => {
		return Object.values(data.details?.holdings ?? {});
	});

	// By Asset Class
	let byAssetClass = $derived.by(() => {
		const map = new Map<string, number>();
		for (const h of holdings) {
			const key = h.assetClass ?? 'Unknown';
			map.set(key, (map.get(key) ?? 0) + (h.valueInBaseCurrency ?? 0));
		}
		return [...map.entries()]
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	});

	// By Currency
	let byCurrency = $derived.by(() => {
		const map = new Map<string, number>();
		for (const h of holdings) {
			const key = h.currency ?? 'Unknown';
			map.set(key, (map.get(key) ?? 0) + (h.valueInBaseCurrency ?? 0));
		}
		return [...map.entries()]
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	});

	// By Asset Sub Class
	let byAssetSubClass = $derived.by(() => {
		const map = new Map<string, number>();
		for (const h of holdings) {
			const key = h.assetSubClass ?? 'Unknown';
			map.set(key, (map.get(key) ?? 0) + (h.valueInBaseCurrency ?? 0));
		}
		return [...map.entries()]
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	});

	// By Sector
	let bySector = $derived.by(() => {
		const map = new Map<string, number>();
		for (const h of holdings) {
			if (!h.sectors?.length) continue;
			for (const s of h.sectors) {
				const val = (h.valueInBaseCurrency ?? 0) * (s.weight ?? 0);
				map.set(s.name, (map.get(s.name) ?? 0) + val);
			}
		}
		return [...map.entries()]
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	});

	// By Country
	let byCountry = $derived.by(() => {
		const map = new Map<string, number>();
		for (const h of holdings) {
			if (!h.countries?.length) continue;
			for (const c of h.countries) {
				const val = (h.valueInBaseCurrency ?? 0) * (c.weight ?? 0);
				map.set(c.name, (map.get(c.name) ?? 0) + val);
			}
		}
		return [...map.entries()]
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 10);
	});

	// By Platform
	let byPlatform = $derived.by(() => {
		const map = new Map<string, number>();
		for (const [, account] of Object.entries(data.details?.accounts ?? {})) {
			const key = account.platform?.name ?? 'Unknown';
			map.set(key, (map.get(key) ?? 0) + (account.current ?? 0));
		}
		return [...map.entries()]
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	});

	// By Holding (top 10)
	let byHolding = $derived.by(() => {
		return holdings
			.map((h) => ({ name: h.name, value: h.valueInBaseCurrency ?? 0 }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 10);
	});

	// Total portfolio value for percentage calc
	let totalValue = $derived.by(() => {
		return holdings.reduce((sum, h) => sum + (h.valueInBaseCurrency ?? 0), 0);
	});

	function pct(value: number): number {
		return totalValue > 0 ? value / totalValue : 0;
	}
</script>

<div class="space-y-6">
	<!-- Net Worth Summary -->
	{#if data.details?.summary}
		<Card.Root>
			<Card.Content class="py-4">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground text-sm">Net Worth</span>
					<span class="text-lg font-semibold">
						<Value value={data.details.summary.currentNetWorth ?? data.details.summary.currentValueInBaseCurrency} currency={baseCurrency} />
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- By Account -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Account</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if accountRows.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each accountRows as row (row.id)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>{row.name}</span>
									<span class="text-muted-foreground">
										<Value value={row.valueInPercentage} type="percent" />
									</span>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {(row.valueInPercentage ?? 0) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- By Asset Class -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Asset Class</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if byAssetClass.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each byAssetClass as item (item.name)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>{item.name}</span>
									<span class="text-muted-foreground">{(pct(item.value) * 100).toFixed(1)}%</span>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {pct(item.value) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- By Asset Sub Class -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Asset Sub Class</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if byAssetSubClass.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each byAssetSubClass as item (item.name)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>{item.name}</span>
									<span class="text-muted-foreground">{(pct(item.value) * 100).toFixed(1)}%</span>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {pct(item.value) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- By Currency -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Currency</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if byCurrency.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each byCurrency as item (item.name)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>{item.name}</span>
									<span class="text-muted-foreground">{(pct(item.value) * 100).toFixed(1)}%</span>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {pct(item.value) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- By Sector -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Sector</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if bySector.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each bySector as item (item.name)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>{item.name}</span>
									<span class="text-muted-foreground">{(pct(item.value) * 100).toFixed(1)}%</span>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {pct(item.value) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- By Country (Top 10) -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Country (Top 10)</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if byCountry.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each byCountry as item (item.name)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>{item.name}</span>
									<span class="text-muted-foreground">{(pct(item.value) * 100).toFixed(1)}%</span>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {pct(item.value) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- By Platform -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Platform</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if byPlatform.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each byPlatform as item (item.name)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span>{item.name}</span>
									<span class="text-muted-foreground">{(pct(item.value) * 100).toFixed(1)}%</span>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {pct(item.value) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- By Holding (Top 10) -->
		<Card.Root class="lg:col-span-2">
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium">By Holding (Top 10)</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if byHolding.length === 0}
					<p class="text-muted-foreground text-sm">No data</p>
				{:else}
					<div class="space-y-2">
						{#each byHolding as item (item.name)}
							<div class="space-y-1">
								<div class="flex justify-between text-sm">
									<span class="truncate">{item.name}</span>
									<span class="text-muted-foreground ml-2 shrink-0"
										>{(pct(item.value) * 100).toFixed(1)}%</span
									>
								</div>
								<div class="bg-muted h-2 rounded-full">
									<div
										class="bg-primary h-2 rounded-full"
										style="width: {pct(item.value) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
