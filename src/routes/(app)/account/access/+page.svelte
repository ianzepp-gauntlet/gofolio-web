<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let accessType = $state<'PRIVATE' | 'PUBLIC'>('PRIVATE');
</script>

<div class="space-y-6">
	{#if form?.error}
		<p class="text-destructive text-sm">{form.error}</p>
	{/if}

	<!-- Security Token -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Security Token</Card.Title>
			<Card.Description>Generate a new security token. Your existing token will be invalidated.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.accessToken}
				<div class="bg-muted mb-3 rounded-md p-3">
					<p class="mb-1 text-xs font-medium">New Security Token:</p>
					<code class="text-xs break-all">{form.accessToken}</code>
				</div>
			{/if}
			<form method="POST" action="?/generateToken" use:enhance>
				<Button type="submit" variant="outline" size="sm">Generate New Token</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Granted Access -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<div>
				<Card.Title class="text-base">Granted Access</Card.Title>
				<Card.Description>Manage who can view your portfolio.</Card.Description>
			</div>
			<Button variant="outline" size="sm" onclick={() => (showCreate = !showCreate)}>
				{showCreate ? 'Cancel' : 'Grant Access'}
			</Button>
		</Card.Header>
		<Card.Content>
			{#if showCreate}
				<form
					method="POST"
					action="?/createAccess"
					use:enhance
					class="border-border mb-4 space-y-3 rounded-md border p-4"
				>
					<div class="grid gap-3 md:grid-cols-2">
						<div class="space-y-1">
							<Label for="alias">Alias</Label>
							<Input id="alias" name="alias" placeholder="Display name" />
						</div>
						<div class="space-y-1">
							<Label for="type">Type</Label>
							<select
								id="type"
								name="type"
								class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
								bind:value={accessType}
							>
								<option value="PRIVATE">Private</option>
								<option value="PUBLIC">Public</option>
							</select>
						</div>
						{#if accessType === 'PRIVATE'}
							<div class="space-y-1">
								<Label for="granteeUserId">Grantee User ID</Label>
								<Input id="granteeUserId" name="granteeUserId" required />
							</div>
							<div class="space-y-1">
								<Label for="permissions">Permission</Label>
								<select
									id="permissions"
									name="permissions"
									class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
								>
									<option value="READ_RESTRICTED">Read (Restricted)</option>
									<option value="READ">Read (Full)</option>
								</select>
							</div>
						{/if}
					</div>
					<Button type="submit" size="sm">Create Access</Button>
				</form>
			{/if}

			{#if data.accesses.length === 0}
				<p class="text-muted-foreground py-4 text-center text-sm">
					No access grants configured.
				</p>
			{:else}
				<div class="border-border overflow-x-auto rounded-md border">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-border bg-muted/50 border-b">
								<th class="px-4 py-2 text-left font-medium">Alias</th>
								<th class="px-4 py-2 text-left font-medium">Type</th>
								<th class="hidden px-4 py-2 text-left font-medium md:table-cell">Grantee</th>
								<th class="px-4 py-2 text-right font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.accesses as access (access.id)}
								<tr class="border-border border-b last:border-0">
									<td class="px-4 py-2">{access.alias || '—'}</td>
									<td class="px-4 py-2">
										<span
											class="rounded px-1.5 py-0.5 text-xs {access.type === 'PUBLIC'
												? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
												: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
										>
											{access.type}
										</span>
									</td>
									<td class="hidden px-4 py-2 font-mono text-xs md:table-cell">
										{access.grantee ?? '—'}
									</td>
									<td class="px-4 py-2 text-right">
										<form method="POST" action="?/deleteAccess" use:enhance>
											<input type="hidden" name="id" value={access.id} />
											<Button type="submit" variant="ghost" size="sm" class="text-destructive"
												>Revoke</Button
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
