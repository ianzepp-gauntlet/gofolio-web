<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { formatDistanceToNow } from 'date-fns';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function relativeDate(dateStr?: string): string {
		if (!dateStr) return '—';
		try {
			return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
		} catch {
			return dateStr;
		}
	}

	function handlePage(newSkip: number) {
		goto(`/admin/users?skip=${newSkip}&take=${data.take}`, { invalidateAll: true });
	}
</script>

<div class="space-y-4">
	{#if form?.error}
		<p class="text-destructive text-sm">{form.error}</p>
	{/if}

	{#if form?.accessToken}
		<div class="border-border bg-muted/50 rounded-md border p-4">
			<p class="mb-1 text-sm font-medium">Generated Access Token:</p>
			<code class="text-xs break-all">{form.accessToken}</code>
		</div>
	{/if}

	{#if data.users.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">No users found.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="gf-table w-full text-sm">
				<thead>
					<tr>
						<th class="px-1 py-2 text-left font-medium">User</th>
						<th class="hidden px-1 py-2 text-left font-medium md:table-cell">Registered</th>
						<th class="hidden px-1 py-2 text-right font-medium md:table-cell">Accounts</th>
						<th class="hidden px-1 py-2 text-right font-medium md:table-cell">Activities</th>
						<th class="hidden px-1 py-2 text-left font-medium lg:table-cell">Role</th>
						<th class="px-1 py-2 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as user (user.id)}
						<tr>
							<td class="px-1 py-2">
								<div>
									<span class="font-mono text-xs">{user.id.substring(0, 8)}...</span>
									{#if user.alias}
										<span class="text-muted-foreground ml-1 text-xs">({user.alias})</span>
									{/if}
								</div>
							</td>
							<td class="hidden px-1 py-2 text-xs md:table-cell"
								>{relativeDate(user.createdAt)}</td
							>
							<td class="hidden px-1 py-2 text-right md:table-cell">{user.accountCount}</td>
							<td class="hidden px-1 py-2 text-right md:table-cell">{user.activitiesCount}</td>
							<td class="hidden px-1 py-2 text-xs lg:table-cell">{user.role ?? '—'}</td>
							<td class="px-1 py-2 text-right">
								<div class="flex justify-end gap-1">
									<form method="POST" action="?/generateToken" use:enhance>
										<input type="hidden" name="userId" value={user.id} />
										<Button type="submit" variant="ghost" size="sm">Token</Button>
									</form>
									<form method="POST" action="?/deleteUser" use:enhance>
										<input type="hidden" name="userId" value={user.id} />
										<Button type="submit" variant="ghost" size="sm" class="text-destructive"
											>Delete</Button
										>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="flex items-center justify-end gap-2 text-sm">
			<Button
				variant="outline"
				size="sm"
				disabled={data.skip === 0}
				onclick={() => handlePage(Math.max(0, data.skip - data.take))}>Previous</Button
			>
			<Button
				variant="outline"
				size="sm"
				disabled={data.users.length < data.take}
				onclick={() => handlePage(data.skip + data.take)}>Next</Button
			>
		</div>
	{/if}
</div>
