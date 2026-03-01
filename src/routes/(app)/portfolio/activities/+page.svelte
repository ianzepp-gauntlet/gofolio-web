<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import Value from '$lib/components/app/Value.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { X } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');
	let totalPages = $derived(Math.max(1, Math.ceil((data.totalItems ?? 0) / data.take)));
	let showCreateDialog = $derived($page.url.searchParams.get('createDialog') === 'true');
	let editActivityId = $derived($page.url.searchParams.get('activityId'));
	let showEditDialog = $derived($page.url.searchParams.get('editDialog') === 'true' && !!editActivityId);
	let selectedActivity = $derived.by(() =>
		editActivityId ? data.activities.find((activity) => activity.id === editActivityId) : undefined
	);

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

	function closeDialogs() {
		void goto('/portfolio/activities', { replaceState: true, keepFocus: true, noScroll: true });
	}

	function editHref(activityId: string): string {
		return `/portfolio/activities?editDialog=true&activityId=${encodeURIComponent(activityId)}`;
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
						<div class="flex items-center justify-center gap-1">
							<a href={editHref(activity.id)}><Button variant="ghost" size="sm">Edit</Button></a>
							<form method="POST" action="?/deleteActivity">
								<input type="hidden" name="activityId" value={activity.id} />
								<Button type="submit" variant="ghost" size="sm">Delete</Button>
							</form>
						</div>
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

{#if showCreateDialog}
	<div class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
		<div class="bg-background border-border w-full max-w-xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Create Activity</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>
			<form method="POST" action="?/createActivity" class="grid gap-3 md:grid-cols-2">
				<div class="space-y-1">
					<Label for="createDate">Date</Label>
					<Input id="createDate" name="date" type="date" required />
				</div>
				<div class="space-y-1">
					<Label for="createType">Type</Label>
					<select
						id="createType"
						name="type"
						class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
					>
						<option value="BUY">BUY</option>
						<option value="SELL">SELL</option>
						<option value="DIVIDEND">DIVIDEND</option>
						<option value="INTEREST">INTEREST</option>
						<option value="FEE">FEE</option>
						<option value="LIABILITY">LIABILITY</option>
					</select>
				</div>
				<div class="space-y-1">
					<Label for="createSymbol">Symbol</Label>
					<Input id="createSymbol" name="symbol" placeholder="AAPL" required />
				</div>
				<div class="space-y-1">
					<Label for="createDataSource">Data Source</Label>
					<Input id="createDataSource" name="dataSource" value="YAHOO" required />
				</div>
				<div class="space-y-1">
					<Label for="createCurrency">Currency</Label>
					<Input id="createCurrency" name="currency" value={baseCurrency} required />
				</div>
				<div class="space-y-1">
					<Label for="createAccountId">Account</Label>
					<select
						id="createAccountId"
						name="accountId"
						class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
					>
						<option value="">No account</option>
						{#each data.user.accounts as account (account.id)}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1">
					<Label for="createQuantity">Quantity</Label>
					<Input id="createQuantity" name="quantity" type="number" step="0.000001" value="0" required />
				</div>
				<div class="space-y-1">
					<Label for="createUnitPrice">Unit Price</Label>
					<Input id="createUnitPrice" name="unitPrice" type="number" step="0.000001" value="0" required />
				</div>
				<div class="space-y-1">
					<Label for="createFee">Fee</Label>
					<Input id="createFee" name="fee" type="number" step="0.000001" value="0" required />
				</div>
				<div class="space-y-1 md:col-span-2">
					<Label for="createComment">Comment</Label>
					<Input id="createComment" name="comment" />
				</div>
				{#if form?.action === 'createActivity' && form?.error}
					<p class="text-destructive md:col-span-2 text-sm">{form.error}</p>
				{/if}
				<div class="md:col-span-2 flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={closeDialogs}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showEditDialog && selectedActivity}
	<div class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
		<div class="bg-background border-border w-full max-w-xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Edit Activity</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>
			<form method="POST" action="?/updateActivity" class="grid gap-3 md:grid-cols-2">
				<input type="hidden" name="id" value={selectedActivity.id} />
				<div class="space-y-1">
					<Label for="editDate">Date</Label>
					<Input
						id="editDate"
						name="date"
						type="date"
						value={new Date(selectedActivity.date).toISOString().slice(0, 10)}
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="editType">Type</Label>
					<Input id="editType" name="type" value={selectedActivity.type ?? 'BUY'} required />
				</div>
				<div class="space-y-1">
					<Label for="editSymbol">Symbol</Label>
					<Input id="editSymbol" name="symbol" value={selectedActivity.symbol ?? ''} required />
				</div>
				<div class="space-y-1">
					<Label for="editDataSource">Data Source</Label>
					<Input
						id="editDataSource"
						name="dataSource"
						value={selectedActivity.dataSource ?? 'YAHOO'}
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="editCurrency">Currency</Label>
					<Input id="editCurrency" name="currency" value={selectedActivity.currency ?? baseCurrency} required />
				</div>
				<div class="space-y-1">
					<Label for="editAccountId">Account</Label>
					<select
						id="editAccountId"
						name="accountId"
						class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
					>
						<option value="">No account</option>
						{#each data.user.accounts as account (account.id)}
							<option value={account.id} selected={account.id === selectedActivity.accountId}>
								{account.name}
							</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1">
					<Label for="editQuantity">Quantity</Label>
					<Input
						id="editQuantity"
						name="quantity"
						type="number"
						step="0.000001"
						value={String(selectedActivity.quantity ?? 0)}
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="editUnitPrice">Unit Price</Label>
					<Input
						id="editUnitPrice"
						name="unitPrice"
						type="number"
						step="0.000001"
						value={String(selectedActivity.unitPrice ?? selectedActivity.value ?? 0)}
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="editFee">Fee</Label>
					<Input
						id="editFee"
						name="fee"
						type="number"
						step="0.000001"
						value={String(selectedActivity.fee ?? 0)}
						required
					/>
				</div>
				<div class="space-y-1 md:col-span-2">
					<Label for="editComment">Comment</Label>
					<Input id="editComment" name="comment" value={selectedActivity.comment ?? ''} />
				</div>
				{#if form?.action === 'updateActivity' && form?.error}
					<p class="text-destructive md:col-span-2 text-sm">{form.error}</p>
				{/if}
				<div class="md:col-span-2 flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={closeDialogs}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
