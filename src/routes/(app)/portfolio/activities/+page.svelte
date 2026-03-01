<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import Value from '$lib/components/app/Value.svelte';
	import { page } from '$app/stores';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');
	let totalPages = $derived(Math.max(1, Math.ceil((data.totalItems ?? 0) / data.take)));

	function currentParamsObject(): Record<string, string> {
		const obj: Record<string, string> = {};
		for (const [key, value] of $page.url.searchParams.entries()) {
			obj[key] = value;
		}
		return obj;
	}

	function encodeParams(params: Record<string, string>): string {
		return Object.entries(params)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&');
	}

	function pageHref(pageNumber: number): string {
		const params = currentParamsObject();
		params.page = String(pageNumber);
		return `/portfolio/activities?${encodeParams(params)}`;
	}

	function sortHref(column: string): string {
		const params = currentParamsObject();
		const currentColumn = data.sortColumn;
		const currentDirection = data.sortDirection;
		const nextDirection =
			currentColumn === column ? (currentDirection === 'asc' ? 'desc' : 'asc') : 'desc';
		params.sortColumn = column;
		params.sortDirection = nextDirection;
		params.page = '1';
		return `/portfolio/activities?${encodeParams(params)}`;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-3">
		<h1 class="text-xl font-semibold">Activities</h1>
		<div class="flex items-center gap-2">
			<a href="/portfolio/activities?createDialog=true"><Button>Create Activity...</Button></a>
		</div>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head><a href={sortHref('date')}>Date</a></Table.Head>
				<Table.Head><a href={sortHref('type')}>Type</a></Table.Head>
				<Table.Head>Symbol</Table.Head>
				<Table.Head class="hidden lg:table-cell">Account</Table.Head>
				<Table.Head class="text-right"><a href={sortHref('quantity')}>Quantity</a></Table.Head>
				<Table.Head class="hidden text-right lg:table-cell"
					><a href={sortHref('unitPrice')}>Unit Price</a></Table.Head
				>
				<Table.Head class="text-right"><a href={sortHref('valueInBaseCurrency')}>Value</a></Table.Head>
				<Table.Head class="w-20 text-center">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.activities as activity (activity.id)}
				<Table.Row class="odd:bg-background even:bg-muted/30">
					<Table.Cell>{new Date(activity.date).toLocaleDateString()}</Table.Cell>
					<Table.Cell>{activity.type ?? '-'}</Table.Cell>
					<Table.Cell>
						<div class="leading-tight">
							<div>{activity.symbol ?? '-'}</div>
							<div class="text-muted-foreground text-xs">{activity.dataSource ?? ''}</div>
						</div>
					</Table.Cell>
					<Table.Cell class="hidden lg:table-cell">{activity.account?.name ?? '-'}</Table.Cell>
					<Table.Cell class="text-right">
						<Value value={activity.quantity ?? 0} type="number" />
					</Table.Cell>
					<Table.Cell class="hidden text-right lg:table-cell">
						<Value
							value={activity.unitPrice ?? activity.value ?? 0}
							currency={activity.currency ?? baseCurrency}
						/>
					</Table.Cell>
					<Table.Cell class="text-right">
						<Value value={activity.valueInBaseCurrency ?? 0} currency={baseCurrency} />
					</Table.Cell>
					<Table.Cell class="text-center">
						<form method="POST" action="?/deleteActivity">
							<input type="hidden" name="activityId" value={activity.id} />
							<Button type="submit" variant="ghost" size="sm">Delete</Button>
						</form>
					</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={8} class="text-muted-foreground py-8 text-center">
						No activities found.
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

	{#if form?.action === 'deleteActivity' && form?.error}
		<p class="text-destructive text-sm">{form.error}</p>
	{/if}

	<div class="flex items-center justify-between">
		<p class="text-muted-foreground text-sm">
			{data.totalItems} activities
		</p>
		<div class="flex items-center gap-2">
			<a href={pageHref(Math.max(1, data.page - 1))}>
				<Button variant="outline" size="sm" disabled={data.page <= 1}>Previous</Button>
			</a>
			<span class="text-sm">Page {data.page} / {totalPages}</span>
			<a href={pageHref(Math.min(totalPages, data.page + 1))}>
				<Button variant="outline" size="sm" disabled={data.page >= totalPages}>Next</Button>
			</a>
		</div>
	</div>
</div>
