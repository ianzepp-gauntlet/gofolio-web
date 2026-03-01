<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { CheckCircle, XCircle, Clock, Play, Pause, X, Eye } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statuses = ['', 'active', 'completed', 'delayed', 'failed', 'paused', 'waiting'];

	let viewingJob = $state<(typeof data.jobs)[number] | null>(null);

	function formatDate(ts?: number): string {
		if (!ts) return '—';
		return new Date(ts).toLocaleString();
	}

	function handleStatusChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		goto(`/admin/jobs${val ? `?status=${val}` : ''}`, { invalidateAll: true });
	}

	function jobStatus(job: (typeof data.jobs)[number]): string {
		if (job.finishedOn && !job.failedReason) return 'completed';
		if (job.failedReason) return 'failed';
		if (job.processedOn) return 'active';
		return data.status || 'waiting';
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
						<th class="px-1 py-2 text-center font-medium w-10">Status</th>
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
						{@const status = jobStatus(job)}
						<tr>
							<td class="px-1 py-2 text-center">
								{#if status === 'completed'}
									<CheckCircle class="text-green-500 size-4 inline" />
								{:else if status === 'failed'}
									<XCircle class="text-red-500 size-4 inline" />
								{:else if status === 'active'}
									<Play class="text-blue-500 size-4 inline" />
								{:else if status === 'paused'}
									<Pause class="text-muted-foreground size-4 inline" />
								{:else}
									<Clock class="text-yellow-500 size-4 inline" />
								{/if}
							</td>
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
									<Button variant="ghost" size="sm" onclick={() => (viewingJob = job)}>
										<Eye class="size-4" />
									</Button>
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

{#if viewingJob}
	<div
		class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
	>
		<div class="bg-background border-border w-full max-w-2xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Job #{viewingJob.id} — {viewingJob.name}</h2>
				<Button variant="ghost" size="icon-sm" onclick={() => (viewingJob = null)}><X class="size-4" /></Button>
			</div>
			<div class="space-y-3">
				<div>
					<h3 class="text-sm font-medium mb-1">Data</h3>
					<pre class="bg-muted/40 rounded-md p-3 text-xs overflow-auto max-h-48">{JSON.stringify(viewingJob.data, null, 2)}</pre>
				</div>
				{#if viewingJob.failedReason}
					<div>
						<h3 class="text-sm font-medium mb-1 text-destructive">Failed Reason</h3>
						<pre class="bg-destructive/10 text-destructive rounded-md p-3 text-xs overflow-auto max-h-32">{viewingJob.failedReason}</pre>
					</div>
				{/if}
				{#if viewingJob.stacktrace?.length}
					<div>
						<h3 class="text-sm font-medium mb-1 text-destructive">Stacktrace</h3>
						<pre class="bg-destructive/10 text-destructive rounded-md p-3 text-xs overflow-auto max-h-48">{viewingJob.stacktrace.join('\n')}</pre>
					</div>
				{/if}
			</div>
			<div class="mt-4 flex justify-end">
				<Button type="button" onclick={() => (viewingJob = null)}>Close</Button>
			</div>
		</div>
	</div>
{/if}
