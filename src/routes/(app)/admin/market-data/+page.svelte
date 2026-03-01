<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let newDataSource = $state('YAHOO');
	let newSymbol = $state('');

	const assetSubClasses = ['', 'BOND', 'COMMODITY', 'CRYPTOCURRENCY', 'ETF', 'MUTUALFUND', 'PRECIOUS_METAL', 'STOCK'];

	function handleFilter(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		const params = new URLSearchParams();
		if (val) params.set('assetSubClass', val);
		goto(`/admin/market-data${params.toString() ? `?${params}` : ''}`, { invalidateAll: true });
	}

	function handlePage(newSkip: number) {
		const params = new URLSearchParams();
		params.set('skip', String(newSkip));
		params.set('take', String(data.take));
		if (data.assetSubClass) params.set('assetSubClass', data.assetSubClass);
		goto(`/admin/market-data?${params}`, { invalidateAll: true });
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			<label for="assetFilter" class="text-sm font-medium">Asset Sub Class:</label>
			<select
				id="assetFilter"
				class="border-input bg-background h-9 rounded-md border px-3 text-sm"
				onchange={handleFilter}
			>
				{#each assetSubClasses as sc (sc)}
					<option value={sc} selected={sc === data.assetSubClass}>{sc || 'All'}</option>
				{/each}
			</select>
		</div>
		<div class="flex gap-2">
			<form method="POST" action="?/gatherRecent" use:enhance>
				<Button type="submit" variant="outline" size="sm">Gather Recent</Button>
			</form>
			<form method="POST" action="?/gatherMax" use:enhance>
				<Button type="submit" variant="outline" size="sm">Gather All</Button>
			</form>
			<form method="POST" action="?/gatherProfileData" use:enhance>
				<Button type="submit" variant="outline" size="sm">Gather Profiles</Button>
			</form>
			<Button variant="default" size="sm" onclick={() => (showCreate = !showCreate)}>
				{showCreate ? 'Cancel' : 'Add'}
			</Button>
		</div>
	</div>

	{#if form?.error}
		<p class="text-destructive text-sm">{form.error}</p>
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/createProfile"
			use:enhance
			class="border-border flex items-end gap-2 rounded-md border p-4"
		>
			<div class="space-y-1">
				<label for="newDataSource" class="text-xs font-medium">Data Source</label>
				<Input id="newDataSource" name="dataSource" bind:value={newDataSource} class="w-40" />
			</div>
			<div class="space-y-1">
				<label for="newSymbol" class="text-xs font-medium">Symbol</label>
				<Input id="newSymbol" name="symbol" bind:value={newSymbol} class="w-40" required />
			</div>
			<Button type="submit" size="sm">Create</Button>
		</form>
	{/if}

	{#if data.marketData.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">No asset profiles found.</p>
	{:else}
		<div class="border-border overflow-x-auto rounded-md border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-border bg-muted/50 border-b">
						<th class="px-4 py-2 text-left font-medium">Name</th>
						<th class="px-4 py-2 text-left font-medium">Symbol</th>
						<th class="hidden px-4 py-2 text-left font-medium md:table-cell">Data Source</th>
						<th class="hidden px-4 py-2 text-left font-medium md:table-cell">Asset Class</th>
						<th class="hidden px-4 py-2 text-left font-medium lg:table-cell">Sub Class</th>
						<th class="hidden px-4 py-2 text-left font-medium lg:table-cell">Currency</th>
						<th class="hidden px-4 py-2 text-right font-medium md:table-cell">Activities</th>
						<th class="hidden px-4 py-2 text-right font-medium lg:table-cell">Data Points</th>
						<th class="px-4 py-2 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.marketData as item (item.dataSource + item.symbol)}
						<tr class="border-border border-b last:border-0">
							<td class="max-w-[200px] truncate px-4 py-2">{item.name || '—'}</td>
							<td class="px-4 py-2 font-mono text-xs">{item.symbol}</td>
							<td class="hidden px-4 py-2 text-xs md:table-cell">{item.dataSource}</td>
							<td class="hidden px-4 py-2 text-xs md:table-cell">{item.assetClass ?? '—'}</td>
							<td class="hidden px-4 py-2 text-xs lg:table-cell">{item.assetSubClass ?? '—'}</td>
							<td class="hidden px-4 py-2 text-xs lg:table-cell">{item.currency ?? '—'}</td>
							<td class="hidden px-4 py-2 text-right md:table-cell">{item.activitiesCount}</td>
							<td class="hidden px-4 py-2 text-right lg:table-cell">{item.marketDataItemCount}</td>
							<td class="px-4 py-2 text-right">
								<form method="POST" action="?/deleteProfile" use:enhance>
									<input type="hidden" name="dataSource" value={item.dataSource} />
									<input type="hidden" name="symbol" value={item.symbol} />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										class="text-destructive"
										disabled={item.activitiesCount > 0}>Delete</Button
									>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		<div class="flex items-center justify-between text-sm">
			<span class="text-muted-foreground">
				{data.skip + 1}–{Math.min(data.skip + data.take, data.count)} of {data.count}
			</span>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={data.skip === 0}
					onclick={() => handlePage(Math.max(0, data.skip - data.take))}>Previous</Button
				>
				<Button
					variant="outline"
					size="sm"
					disabled={data.skip + data.take >= data.count}
					onclick={() => handlePage(data.skip + data.take)}>Next</Button
				>
			</div>
		</div>
	{/if}
</div>
