<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showAddPlatform = $state(false);
	let showAddTag = $state(false);
</script>

<div class="space-y-6">
	{#if form?.error}
		<p class="text-destructive text-sm">{form.error}</p>
	{/if}

	<!-- Data Providers -->
	{#if data.admin?.dataProviders?.length}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Data Providers</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="border-border overflow-x-auto rounded-md border">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-border bg-muted/50 border-b">
								<th class="px-4 py-2 text-left font-medium">Name</th>
								<th class="px-4 py-2 text-right font-medium">Asset Profiles</th>
							</tr>
						</thead>
						<tbody>
							{#each data.admin.dataProviders as provider (provider.name)}
								<tr class="border-border border-b last:border-0">
									<td class="px-4 py-2">{provider.name}</td>
									<td class="px-4 py-2 text-right">{provider.assetProfileCount}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Platforms -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="text-base">Platforms</Card.Title>
			<Button variant="outline" size="sm" onclick={() => (showAddPlatform = !showAddPlatform)}>
				{showAddPlatform ? 'Cancel' : 'Add'}
			</Button>
		</Card.Header>
		<Card.Content>
			{#if showAddPlatform}
				<form
					method="POST"
					action="?/createPlatform"
					use:enhance
					class="border-border mb-4 flex items-end gap-2 rounded-md border p-3"
				>
					<div class="space-y-1">
						<label for="platName" class="text-xs font-medium">Name</label>
						<Input id="platName" name="name" required class="w-40" />
					</div>
					<div class="space-y-1">
						<label for="platUrl" class="text-xs font-medium">URL</label>
						<Input id="platUrl" name="url" class="w-48" />
					</div>
					<Button type="submit" size="sm">Create</Button>
				</form>
			{/if}

			{#if data.platforms.length === 0}
				<p class="text-muted-foreground py-4 text-center text-sm">No platforms configured.</p>
			{:else}
				<div class="border-border overflow-x-auto rounded-md border">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-border bg-muted/50 border-b">
								<th class="px-4 py-2 text-left font-medium">Name</th>
								<th class="px-4 py-2 text-left font-medium">URL</th>
								<th class="px-4 py-2 text-right font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.platforms as platform (platform.id)}
								<tr class="border-border border-b last:border-0">
									<td class="px-4 py-2">{platform.name}</td>
									<td class="max-w-[200px] truncate px-4 py-2 text-xs">{platform.url ?? '—'}</td>
									<td class="px-4 py-2 text-right">
										<form method="POST" action="?/deletePlatform" use:enhance>
											<input type="hidden" name="id" value={platform.id} />
											<Button type="submit" variant="ghost" size="sm" class="text-destructive"
												>Delete</Button
											>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Tags -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="text-base">Tags</Card.Title>
			<Button variant="outline" size="sm" onclick={() => (showAddTag = !showAddTag)}>
				{showAddTag ? 'Cancel' : 'Add'}
			</Button>
		</Card.Header>
		<Card.Content>
			{#if showAddTag}
				<form
					method="POST"
					action="?/createTag"
					use:enhance
					class="border-border mb-4 flex items-end gap-2 rounded-md border p-3"
				>
					<div class="space-y-1">
						<label for="tagName" class="text-xs font-medium">Name</label>
						<Input id="tagName" name="name" required class="w-48" />
					</div>
					<Button type="submit" size="sm">Create</Button>
				</form>
			{/if}

			{#if data.tags.length === 0}
				<p class="text-muted-foreground py-4 text-center text-sm">No tags configured.</p>
			{:else}
				<div class="border-border overflow-x-auto rounded-md border">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-border bg-muted/50 border-b">
								<th class="px-4 py-2 text-left font-medium">Name</th>
								<th class="px-4 py-2 text-right font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.tags as tag (tag.id)}
								<tr class="border-border border-b last:border-0">
									<td class="px-4 py-2">{tag.name}</td>
									<td class="px-4 py-2 text-right">
										<form method="POST" action="?/deleteTag" use:enhance>
											<input type="hidden" name="id" value={tag.id} />
											<Button type="submit" variant="ghost" size="sm" class="text-destructive"
												>Delete</Button
											>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
