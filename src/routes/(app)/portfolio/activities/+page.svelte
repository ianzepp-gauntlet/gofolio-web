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

	interface HoldingDetailResponse {
		SymbolProfile?: {
			name?: string;
			symbol?: string;
		};
		activitiesCount?: number;
		averagePrice?: number;
		marketPrice?: number;
		value?: number;
		quantity?: number;
		netPerformanceWithCurrencyEffect?: number;
		netPerformancePercentWithCurrencyEffect?: number;
	}

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');
	let totalPages = $derived(Math.max(1, Math.ceil((data.totalItems ?? 0) / data.take)));
	let showCreateDialog = $derived($page.url.searchParams.get('createDialog') === 'true');
	let activityIdFromQuery = $derived($page.url.searchParams.get('activityId'));
	let selectedActivity = $derived.by(() =>
		activityIdFromQuery
			? data.activities.find((activity) => activity.id === activityIdFromQuery)
			: undefined
	);
	let showEditDialog = $derived(
		$page.url.searchParams.get('editDialog') === 'true' && !!selectedActivity
	);
	let showHoldingDetailDialog = $derived(
		$page.url.searchParams.get('holdingDetailDialog') === 'true'
	);
	let selectedDataSource = $derived($page.url.searchParams.get('dataSource'));
	let selectedSymbol = $derived($page.url.searchParams.get('symbol'));

	let detailLoading = $state(false);
	let detailError = $state<string | null>(null);
	let detailData = $state<HoldingDetailResponse | null>(null);

	const dialogQueryKeys = new Set([
		'createDialog',
		'editDialog',
		'activityId',
		'holdingDetailDialog',
		'dataSource',
		'symbol'
	]);

	$effect(() => {
		if (!showHoldingDetailDialog || !selectedDataSource || !selectedSymbol) {
			detailLoading = false;
			detailError = null;
			detailData = null;
			return;
		}

		detailLoading = true;
		detailError = null;

		void fetch(
			`/api/v1/portfolio/holding/${encodeURIComponent(selectedDataSource)}/${encodeURIComponent(selectedSymbol)}`
		)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(await response.text());
				}
				detailData = await response.json();
			})
			.catch(() => {
				detailError = 'Unable to load holding details.';
				detailData = null;
			})
			.finally(() => {
				detailLoading = false;
			});
	});

	function currentParamsObject(): Record<string, string> {
		const obj: Record<string, string> = {};
		for (const [key, value] of $page.url.searchParams.entries()) {
			obj[key] = value;
		}
		return obj;
	}

	function currentParamsWithoutDialogs(): Record<string, string> {
		const params = currentParamsObject();
		for (const key of dialogQueryKeys) {
			delete params[key];
		}
		return params;
	}

	function encodeParams(params: Record<string, string>): string {
		return Object.entries(params)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&');
	}

	function pageHref(pageNumber: number): string {
		const params = currentParamsWithoutDialogs();
		params.page = String(pageNumber);
		return `/portfolio/activities?${encodeParams(params)}`;
	}

	function sortHref(column: string): string {
		const params = currentParamsWithoutDialogs();
		const currentColumn = data.sortColumn;
		const currentDirection = data.sortDirection;
		const nextDirection =
			currentColumn === column ? (currentDirection === 'asc' ? 'desc' : 'asc') : 'desc';
		params.sortColumn = column;
		params.sortDirection = nextDirection;
		params.page = '1';
		return `/portfolio/activities?${encodeParams(params)}`;
	}

	function dialogHref(params: Record<string, string>): string {
		return `/portfolio/activities?${encodeParams({ ...currentParamsWithoutDialogs(), ...params })}`;
	}

	function closeDialogs() {
		const params = encodeParams(currentParamsWithoutDialogs());
		void goto(`/portfolio/activities${params ? `?${params}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function editHref(activityId: string): string {
		return dialogHref({ editDialog: 'true', activityId });
	}

	function holdingDetailHref(dataSource: string, symbol: string): string {
		return dialogHref({
			holdingDetailDialog: 'true',
			dataSource,
			symbol
		});
	}

	function canOpenHolding(activity: (typeof data.activities)[number]): boolean {
		return typeof activity.dataSource === 'string' && !!activity.dataSource && !!activity.symbol;
	}

	function openHoldingDetail(activity: (typeof data.activities)[number]) {
		if (!canOpenHolding(activity)) {
			return;
		}
		void goto(holdingDetailHref(activity.dataSource!, activity.symbol!), {
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-3">
		<h1 class="text-xl font-semibold">Activities</h1>
		<div class="flex items-center gap-2">
			<a href={dialogHref({ createDialog: 'true' })}><Button>Create Activity...</Button></a>
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
				<Table.Head class="text-right"
					><a href={sortHref('valueInBaseCurrency')}>Value</a></Table.Head
				>
				<Table.Head class="w-20 text-center">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.activities as activity (activity.id)}
				<Table.Row
					class="odd:bg-background even:bg-muted/30 {canOpenHolding(activity)
						? 'hover:bg-muted/50 cursor-pointer'
						: ''}"
					onclick={() => openHoldingDetail(activity)}
				>
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
					<Table.Cell class="text-center" onclick={(event) => event.stopPropagation()}>
						<div class="flex items-center justify-center gap-1">
							{#if canOpenHolding(activity)}
								<a href={holdingDetailHref(activity.dataSource!, activity.symbol!)}>
									<Button variant="ghost" size="sm">View Holding...</Button>
								</a>
							{/if}
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
	<div
		class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
	>
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
					<Input
						id="createQuantity"
						name="quantity"
						type="number"
						step="0.000001"
						value="0"
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="createUnitPrice">Unit Price</Label>
					<Input
						id="createUnitPrice"
						name="unitPrice"
						type="number"
						step="0.000001"
						value="0"
						required
					/>
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
					<p class="text-destructive text-sm md:col-span-2">{form.error}</p>
				{/if}
				<div class="flex justify-end gap-2 md:col-span-2">
					<Button type="button" variant="ghost" onclick={closeDialogs}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showEditDialog && selectedActivity}
	<div
		class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
	>
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
					<Input
						id="editCurrency"
						name="currency"
						value={selectedActivity.currency ?? baseCurrency}
						required
					/>
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
					<p class="text-destructive text-sm md:col-span-2">{form.error}</p>
				{/if}
				<div class="flex justify-end gap-2 md:col-span-2">
					<Button type="button" variant="ghost" onclick={closeDialogs}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showHoldingDetailDialog && selectedDataSource && selectedSymbol}
	<div
		class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
	>
		<div class="bg-background border-border w-full max-w-2xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">
					{detailData?.SymbolProfile?.name ?? detailData?.SymbolProfile?.symbol ?? selectedSymbol}
				</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>
			{#if detailLoading}
				<p class="text-muted-foreground py-8 text-center text-sm">Loading holding details...</p>
			{:else if detailError}
				<p class="text-destructive py-8 text-center text-sm">{detailError}</p>
			{:else if detailData}
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Quantity</div>
						<div class="text-sm font-medium">{detailData.quantity ?? '-'}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Average Price</div>
						<div class="text-sm font-medium">
							<Value value={detailData.averagePrice} currency={baseCurrency} />
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Market Price</div>
						<div class="text-sm font-medium">
							<Value value={detailData.marketPrice} currency={baseCurrency} />
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Value</div>
						<div class="text-sm font-medium">
							<Value value={detailData.value} currency={baseCurrency} />
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Net Performance</div>
						<div class="text-sm font-medium">
							<Value
								value={detailData.netPerformanceWithCurrencyEffect}
								currency={baseCurrency}
								colorized
							/>
						</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-muted-foreground text-xs">Performance</div>
						<div class="text-sm font-medium">
							<Value
								value={detailData.netPerformancePercentWithCurrencyEffect}
								type="percent"
								colorized
							/>
						</div>
					</div>
				</div>
			{:else}
				<p class="text-muted-foreground py-8 text-center text-sm">No holding details available.</p>
			{/if}
			<div class="mt-4 flex justify-end">
				<Button type="button" onclick={closeDialogs}>Close</Button>
			</div>
		</div>
	</div>
{/if}
