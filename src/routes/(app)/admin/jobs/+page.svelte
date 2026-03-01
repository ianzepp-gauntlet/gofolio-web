<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statuses = ['', 'active', 'completed', 'delayed', 'failed', 'paused', 'waiting'];

	function formatDate(ts?: number): string {
		if (!ts) return '—';
		return new Date(ts).toLocaleString();
	}

	function handleStatusChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		goto(`/admin/jobs${val ? `?status=${val}` : ''}`, { invalidateAll: true });
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			<label for="statusFilter" class="text-sm font-medium">Status:</label>
			<select
				id="statusFilter"
				class="border-input bg-background h-9 rounded-md border px-3 text-sm"
				onchange={handleStatusChange}
			>
				{#each statuses as s (s)}
					<option value={s} selected={s === data.status}>{s || 'All'}</option>
				{/each}
			</select>
		</div>
		{#if data.status}
			<form method="POST" action="?/deleteAll" use:enhance>
				<input type="hidden" name="status" value={data.status} />
				<Button type="submit" variant="destructive" size="sm">Delete {data.status} jobs</Button>
			</form>
		{/if}
	</div>

	{#if form?.error}
		<p class="text-destructive text-sm">{form.error}</p>
	{/if}

	{#if data.jobs.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">No jobs found.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="gf-table w-full text-sm">
				<thead>
					<tr>
						<th class="px-1 py-2 text-left font-medium">ID</th>
						<th class="px-1 py-2 text-left font-medium">Type</th>
						<th class="px-1 py-2 text-left font-medium">Symbol</th>
						<th class="hidden px-1 py-2 text-left font-medium md:table-cell">Data Source</th>
						<th class="hidden px-1 py-2 text-right font-medium md:table-cell">Attempts</th>
						<th class="hidden px-1 py-2 text-left font-medium lg:table-cell">Created</th>
						<th class="hidden px-1 py-2 text-left font-medium lg:table-cell">Finished</th>
						<th class="px-1 py-2 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.jobs as job (job.id)}
						<tr>
							<td class="px-1 py-2 font-mono text-xs">{job.id}</td>
							<td class="px-1 py-2">{job.name}</td>
							<td class="px-1 py-2 font-mono text-xs"
								>{(job.data as Record<string, unknown>)?.['symbol'] ?? '—'}</td
							>
							<td class="hidden px-1 py-2 font-mono text-xs md:table-cell"
								>{(job.data as Record<string, unknown>)?.['dataSource'] ?? '—'}</td
							>
							<td class="hidden px-1 py-2 text-right md:table-cell">{job.attemptsMade}</td>
							<td class="hidden px-1 py-2 text-xs lg:table-cell">{formatDate(job.timestamp)}</td>
							<td class="hidden px-1 py-2 text-xs lg:table-cell">{formatDate(job.finishedOn)}</td>
							<td class="px-1 py-2 text-right">
								<div class="flex justify-end gap-1">
									<form method="POST" action="?/executeJob" use:enhance>
										<input type="hidden" name="jobId" value={job.id} />
										<Button type="submit" variant="ghost" size="sm">Run</Button>
									</form>
									<form method="POST" action="?/deleteJob" use:enhance>
										<input type="hidden" name="jobId" value={job.id} />
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
	{/if}
</div>
