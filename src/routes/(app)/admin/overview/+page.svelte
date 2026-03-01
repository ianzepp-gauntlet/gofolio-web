<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let settings = $derived(data.admin?.settings ?? {});
	let systemMessage = $state('');
	$effect(() => {
		systemMessage = data.admin?.settings?.SYSTEM_MESSAGE ?? '';
	});
	let isDataGathering = $derived(settings.ENABLE_DATA_GATHERING === 'true');
	let isUserSignup = $derived(settings.ENABLE_FEATURE_REGISTRATION === 'true');
	let isReadOnly = $derived(settings.IS_READ_ONLY_MODE === 'true');
</script>

<div class="space-y-6">
	{#if !data.admin}
		<p class="text-muted-foreground text-sm">Unable to load admin data.</p>
	{:else}
		<!-- System Statistics -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card.Root class="border">
				<Card.Header class="pb-2">
					<Card.Description>Users</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-2xl font-bold">{data.admin.userCount}</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border">
				<Card.Header class="pb-2">
					<Card.Description>Activities</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-2xl font-bold">{data.admin.activitiesCount}</p>
					{#if data.admin.userCount > 0}
						<p class="text-muted-foreground text-xs">
							{(data.admin.activitiesCount / data.admin.userCount).toFixed(1)} per user
						</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root class="border">
				<Card.Header class="pb-2">
					<Card.Description>Data Providers</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-2xl font-bold">{data.admin.dataProviders?.length ?? 0}</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border">
				<Card.Header class="pb-2">
					<Card.Description>Version</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="font-mono text-sm">{data.admin.version ?? '—'}</p>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Data Providers -->
		{#if data.admin.dataProviders?.length}
			<div>
				<h3 class="mb-3 text-sm font-medium">Data Providers</h3>
				<div class="overflow-x-auto">
					<table class="gf-table w-full text-sm">
						<thead>
							<tr>
								<th class="px-1 py-2 text-left font-medium">Name</th>
								<th class="px-1 py-2 text-right font-medium">Asset Profiles</th>
							</tr>
						</thead>
						<tbody>
							{#each data.admin.dataProviders as provider (provider.name)}
								<tr>
									<td class="px-1 py-2">{provider.name}</td>
									<td class="px-1 py-2 text-right">{provider.assetProfileCount}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Exchange Rates -->
		{#if data.admin.exchangeRates?.length}
			<div>
				<h3 class="mb-3 text-sm font-medium">Exchange Rates</h3>
				<div class="overflow-x-auto">
					<table class="gf-table w-full text-sm">
						<thead>
							<tr>
								<th class="px-1 py-2 text-left font-medium">Pair</th>
								<th class="px-1 py-2 text-right font-medium">Rate</th>
							</tr>
						</thead>
						<tbody>
							{#each data.admin.exchangeRates as rate (rate.label)}
								<tr>
									<td class="px-1 py-2 font-mono text-xs">{rate.label}</td>
									<td class="px-1 py-2 text-right font-mono text-xs"
										>{rate.value?.toFixed(4) ?? '—'}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- System Configuration -->
		<div>
			<h3 class="mb-3 text-sm font-medium">System Configuration</h3>
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<form method="POST" action="?/putSetting" use:enhance class="flex items-center gap-2">
						<input type="hidden" name="key" value="ENABLE_DATA_GATHERING" />
						<input type="hidden" name="value" value={isDataGathering ? 'false' : 'true'} />
						<input type="checkbox" checked={isDataGathering} class="size-4 rounded" onchange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()} />
						<Label>Enable Data Gathering</Label>
					</form>
				</div>
				<div class="flex items-center gap-3">
					<form method="POST" action="?/putSetting" use:enhance class="flex items-center gap-2">
						<input type="hidden" name="key" value="ENABLE_FEATURE_REGISTRATION" />
						<input type="hidden" name="value" value={isUserSignup ? 'false' : 'true'} />
						<input type="checkbox" checked={isUserSignup} class="size-4 rounded" onchange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()} />
						<Label>Enable User Signup</Label>
					</form>
				</div>
				<div class="flex items-center gap-3">
					<form method="POST" action="?/putSetting" use:enhance class="flex items-center gap-2">
						<input type="hidden" name="key" value="IS_READ_ONLY_MODE" />
						<input type="hidden" name="value" value={isReadOnly ? 'false' : 'true'} />
						<input type="checkbox" checked={isReadOnly} class="size-4 rounded" onchange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()} />
						<Label>Read-Only Mode</Label>
					</form>
				</div>
				<div class="space-y-1">
					<Label for="systemMessage">System Message</Label>
					<form method="POST" action="?/putSetting" use:enhance class="flex gap-2">
						<input type="hidden" name="key" value="SYSTEM_MESSAGE" />
						<Input id="systemMessage" name="value" bind:value={systemMessage} placeholder="Enter system message..." class="flex-1" />
						<Button type="submit" variant="outline" size="sm">Save</Button>
					</form>
				</div>
			</div>
		</div>

		<!-- Housekeeping -->
		<div>
			<h3 class="mb-3 text-sm font-medium">Housekeeping</h3>
			<div class="flex flex-wrap gap-2">
				<form method="POST" action="?/flushCache" use:enhance>
					<Button type="submit" variant="outline" size="sm">Flush Cache</Button>
				</form>
				<form method="POST" action="?/gather" use:enhance>
					<Button type="submit" variant="outline" size="sm">Gather Data</Button>
				</form>
			</div>
			{#if form?.error}
				<p class="text-destructive mt-2 text-sm">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="text-muted-foreground mt-2 text-sm">Action completed successfully.</p>
			{/if}
		</div>
	{/if}
</div>
