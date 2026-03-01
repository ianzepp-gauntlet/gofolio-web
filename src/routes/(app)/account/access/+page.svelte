<script lang="ts">
	import type { ActionData, PageData } from './$types';
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
	<section>
		<h3 class="mb-3 text-sm font-medium">Security Token</h3>
		<p class="text-muted-foreground mb-3 text-sm">Generate a new security token. Your existing token will be invalidated.</p>
		{#if form?.accessToken}
			<div class="bg-muted mb-3 rounded-md p-3">
				<p class="mb-1 text-xs font-medium">New Security Token:</p>
				<code class="text-xs break-all">{form.accessToken}</code>
			</div>
		{/if}
		<form method="POST" action="?/generateToken" use:enhance>
			<Button type="submit" variant="outline" size="sm">Generate New Token</Button>
		</form>
	</section>

	<!-- Granted Access -->
	<section>
		<div class="mb-3 flex items-center justify-between">
			<div>
				<h3 class="text-sm font-medium">Granted Access</h3>
				<p class="text-muted-foreground text-sm">Manage who can view your portfolio.</p>
			</div>
			<Button variant="outline" size="sm" onclick={() => (showCreate = !showCreate)}>
				{showCreate ? 'Cancel' : 'Grant Access'}
			</Button>
		</div>

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
			<div class="overflow-x-auto">
				<table class="gf-table w-full text-sm">
					<thead>
						<tr>
							<th class="px-1 py-2 text-left font-medium">Alias</th>
							<th class="px-1 py-2 text-left font-medium">Type</th>
							<th class="hidden px-1 py-2 text-left font-medium md:table-cell">Grantee</th>
							<th class="px-1 py-2 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.accesses as access (access.id)}
							<tr>
								<td class="px-1 py-2">{access.alias || '—'}</td>
								<td class="px-1 py-2">
									<span
										class="rounded px-1.5 py-0.5 text-xs {access.type === 'PUBLIC'
											? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
											: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
									>
										{access.type}
									</span>
								</td>
								<td class="hidden px-1 py-2 font-mono text-xs md:table-cell">
									{access.grantee ?? '—'}
								</td>
								<td class="px-1 py-2 text-right">
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
	</section>
</div>
