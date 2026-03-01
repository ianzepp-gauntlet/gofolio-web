<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import type { ActivityItem } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import Value from '$lib/components/app/Value.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Copy, Ellipsis, Pencil, Plus, Tablet, Trash2, X } from '@lucide/svelte';

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

	interface ImportPayload {
		activities: unknown[];
		accounts?: unknown[];
		assetProfiles?: unknown[];
		tags?: unknown[];
	}

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');
	let totalPages = $derived(Math.max(1, Math.ceil((data.totalItems ?? 0) / data.take)));
	let showCreateDialog = $derived($page.url.searchParams.get('createDialog') === 'true');
	let showImportDialog = $derived($page.url.searchParams.get('importDialog') === 'true');
	let queryFilter = $derived($page.url.searchParams.get('query') ?? '');
	let accountFilter = $derived($page.url.searchParams.get('accounts') ?? '');
	let canCreateActivity = $derived(
		data.user.permissions.includes('createOrder') && !data.user.settings?.isRestrictedView
	);
	let activityIdFromQuery = $derived($page.url.searchParams.get('activityId'));
	let selectedActivity = $derived.by(() =>
		activityIdFromQuery
			? data.activities.find((activity) => activity.id === activityIdFromQuery)
			: undefined
	);
	let showEditDialog = $derived(
		$page.url.searchParams.get('editDialog') === 'true' && !!selectedActivity
	);
	let createSeedActivity = $derived(
		showCreateDialog && activityIdFromQuery ? selectedActivity : undefined
	);
	let showHoldingDetailDialog = $derived(
		$page.url.searchParams.get('holdingDetailDialog') === 'true'
	);
	let selectedDataSource = $derived($page.url.searchParams.get('dataSource'));
	let selectedSymbol = $derived($page.url.searchParams.get('symbol'));

	let detailLoading = $state(false);
	let detailError = $state<string | null>(null);
	let detailData = $state<HoldingDetailResponse | null>(null);
	let importFileName = $state<string | null>(null);
	let importPayload = $state<ImportPayload | null>(null);
	let previewActivities = $state<ActivityItem[]>([]);
	let importError = $state<string | null>(null);
	let dryRunLoading = $state(false);
	let importInProgress = $state(false);

	const dialogQueryKeys = new Set([
		'createDialog',
		'importDialog',
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

	$effect(() => {
		if (!showImportDialog) {
			importFileName = null;
			importPayload = null;
			previewActivities = [];
			importError = null;
			dryRunLoading = false;
			importInProgress = false;
		}
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

	function clearFiltersHref(): string {
		const params = currentParamsWithoutDialogs();
		delete params.query;
		delete params.accounts;
		params.page = '1';
		return `/portfolio/activities?${encodeParams(params)}`;
	}

	function normalizeImportPayload(parsed: unknown): ImportPayload | null {
		if (Array.isArray(parsed)) {
			return { activities: parsed };
		}

		if (parsed && typeof parsed === 'object') {
			const obj = parsed as Record<string, unknown>;
			if (Array.isArray(obj.activities)) {
				return {
					activities: obj.activities,
					accounts: Array.isArray(obj.accounts) ? obj.accounts : undefined,
					assetProfiles: Array.isArray(obj.assetProfiles) ? obj.assetProfiles : undefined,
					tags: Array.isArray(obj.tags) ? obj.tags : undefined
				};
			}
		}

		return null;
	}

	async function onImportFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) {
			return;
		}

		importError = null;
		previewActivities = [];
		importPayload = null;
		importFileName = file.name;

		if (!file.name.toLowerCase().endsWith('.json')) {
			importError = 'Only JSON import files are supported in this phase.';
			return;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(await file.text());
		} catch {
			importError = 'Unable to parse JSON file.';
			return;
		}

		const payload = normalizeImportPayload(parsed);
		if (!payload || payload.activities.length === 0) {
			importError = 'Import file must contain an activities array.';
			return;
		}

		dryRunLoading = true;
		try {
			const response = await fetch('/api/v1/import?dryRun=true', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			const dryRunResult = (await response.json()) as { activities?: ActivityItem[] };
			previewActivities = dryRunResult.activities ?? [];
			importPayload = payload;
		} catch {
			importError = 'Dry run failed. Please verify your import file.';
			importPayload = null;
			previewActivities = [];
		} finally {
			dryRunLoading = false;
		}
	}

	async function confirmImport() {
		if (!importPayload) {
			return;
		}

		importError = null;
		importInProgress = true;
		try {
			const response = await fetch('/api/v1/import?dryRun=false', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(importPayload)
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			const params = encodeParams(currentParamsWithoutDialogs());
			await goto(`/portfolio/activities${params ? `?${params}` : ''}`, {
				replaceState: true,
				keepFocus: true,
				noScroll: true,
				invalidateAll: true
			});
		} catch {
			importError = 'Import failed. Please try again.';
		} finally {
			importInProgress = false;
		}
	}

	function submitDelete(activityId: string) {
		const form = document.getElementById(`delete-activity-${activityId}`) as HTMLFormElement | null;
		form?.requestSubmit();
	}
</script>

<div class="space-y-4">
	<h1 class="text-xl font-semibold">Activities</h1>

	{#if canCreateActivity}
		<div class="flex justify-end">
			<a href={dialogHref({ importDialog: 'true' })}>
				<Button variant="outline">Import Activities...</Button>
			</a>
		</div>
	{/if}

	<div class="bg-muted/20 border-border rounded-md border p-3">
		<form
			method="GET"
			action="/portfolio/activities"
			class="grid gap-2 md:grid-cols-[1fr_220px_auto]"
		>
			<input type="hidden" name="page" value="1" />
			<input type="hidden" name="take" value={String(data.take)} />
			<input type="hidden" name="sortColumn" value={data.sortColumn} />
			<input type="hidden" name="sortDirection" value={data.sortDirection} />
			<div class="space-y-1">
				<Label for="activitiesQuery">Search</Label>
				<Input
					id="activitiesQuery"
					name="query"
					placeholder="Symbol, name, note"
					value={queryFilter}
				/>
			</div>
			<div class="space-y-1">
				<Label for="activitiesAccount">Account</Label>
				<select
					id="activitiesAccount"
					name="accounts"
					class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
				>
					<option value="">All accounts</option>
					{#each data.user.accounts as account (account.id)}
						<option value={account.id} selected={account.id === accountFilter}
							>{account.name}</option
						>
					{/each}
				</select>
			</div>
			<div class="flex items-end gap-2">
				<Button type="submit" variant="outline">Apply</Button>
				<a href={clearFiltersHref()}><Button type="button" variant="ghost">Clear</Button></a>
			</div>
		</form>
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
				<Table.Head class="w-12 text-center">Actions</Table.Head>
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
						<form
							method="POST"
							action="?/deleteActivity"
							id={`delete-activity-${activity.id}`}
							class="hidden"
						>
							<input type="hidden" name="activityId" value={activity.id} />
						</form>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class="hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md"
							>
								<Ellipsis class="size-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-48">
								{#if canOpenHolding(activity)}
									<DropdownMenu.Item
										onclick={() =>
											void goto(holdingDetailHref(activity.dataSource!, activity.symbol!), {
												keepFocus: true,
												noScroll: true
											})}
									>
										<Tablet class="size-4" />
										View Holding...
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Item
									onclick={() =>
										void goto(editHref(activity.id), { keepFocus: true, noScroll: true })}
								>
									<Pencil class="size-4" />
									Edit...
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() =>
										void goto(dialogHref({ createDialog: 'true', activityId: activity.id }), {
											keepFocus: true,
											noScroll: true
										})}
								>
									<Copy class="size-4" />
									Clone...
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive" onclick={() => submitDelete(activity.id)}>
									<Trash2 class="size-4" />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
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

{#if canCreateActivity}
	<div class="fixed right-6 bottom-6 z-40">
		<a href={dialogHref({ createDialog: 'true' })}>
			<Button size="icon-lg" class="rounded-full shadow-lg">
				<Plus class="size-5" />
				<span class="sr-only">Create Activity</span>
			</Button>
		</a>
	</div>
{/if}

{#if showImportDialog}
	<div
		class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
	>
		<div class="bg-background border-border w-full max-w-3xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Import Activities</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>

			<div class="space-y-3">
				<div class="space-y-1">
					<Label for="importActivitiesFile">Select JSON File</Label>
					<Input
						id="importActivitiesFile"
						type="file"
						accept=".json,application/json"
						onchange={onImportFileChange}
					/>
				</div>

				{#if importFileName}
					<p class="text-muted-foreground text-sm">Selected: {importFileName}</p>
				{/if}

				{#if dryRunLoading}
					<p class="text-muted-foreground text-sm">Validating import file...</p>
				{/if}

				{#if importError}
					<p class="text-destructive text-sm">{importError}</p>
				{/if}

				{#if importPayload}
					<div class="bg-muted/20 border-border rounded-md border p-3">
						<p class="text-sm font-medium">Dry run preview</p>
						<p class="text-muted-foreground text-sm">
							{previewActivities.length} activities ready to import.
						</p>
						<div class="mt-3 overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="text-muted-foreground border-border border-b text-left">
										<th class="py-1 pr-3">Date</th>
										<th class="py-1 pr-3">Type</th>
										<th class="py-1 pr-3">Symbol</th>
										<th class="py-1 text-right">Value</th>
									</tr>
								</thead>
								<tbody>
									{#each previewActivities.slice(0, 10) as activity (activity.id ?? `${activity.date}-${activity.symbol}`)}
										<tr class="border-border border-b last:border-b-0">
											<td class="py-1 pr-3">{new Date(activity.date).toLocaleDateString()}</td>
											<td class="py-1 pr-3">{activity.type ?? '-'}</td>
											<td class="py-1 pr-3">{activity.symbol ?? '-'}</td>
											<td class="py-1 text-right">
												<Value
													value={activity.valueInBaseCurrency ?? activity.value ?? 0}
													currency={baseCurrency}
												/>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						{#if previewActivities.length > 10}
							<p class="text-muted-foreground mt-2 text-xs">
								Showing first 10 activities from the dry run preview.
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="mt-4 flex justify-end gap-2">
				<Button type="button" variant="ghost" onclick={closeDialogs}>Cancel</Button>
				<Button
					type="button"
					onclick={confirmImport}
					disabled={!importPayload || dryRunLoading || importInProgress}
				>
					{importInProgress ? 'Importing...' : 'Import'}
				</Button>
			</div>
		</div>
	</div>
{/if}

{#if showCreateDialog}
	<div
		class="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
	>
		<div class="bg-background border-border w-full max-w-xl rounded-lg border p-5 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">
					{createSeedActivity ? 'Clone Activity' : 'Create Activity'}
				</h2>
				<Button variant="ghost" size="icon-sm" onclick={closeDialogs}><X class="size-4" /></Button>
			</div>
			<form method="POST" action="?/createActivity" class="grid gap-3 md:grid-cols-2">
				<div class="space-y-1">
					<Label for="createDate">Date</Label>
					<Input
						id="createDate"
						name="date"
						type="date"
						value={new Date().toISOString().slice(0, 10)}
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="createType">Type</Label>
					<select
						id="createType"
						name="type"
						value={createSeedActivity?.type ?? 'BUY'}
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
					<Input
						id="createSymbol"
						name="symbol"
						placeholder="AAPL"
						value={createSeedActivity?.symbol ?? ''}
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="createDataSource">Data Source</Label>
					<Input
						id="createDataSource"
						name="dataSource"
						value={createSeedActivity?.dataSource ?? 'YAHOO'}
						required
					/>
				</div>
				<div class="space-y-1">
					<Label for="createCurrency">Currency</Label>
					<Input
						id="createCurrency"
						name="currency"
						value={createSeedActivity?.currency ?? baseCurrency}
						required
					/>
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
							<option value={account.id} selected={account.id === createSeedActivity?.accountId}>
								{account.name}
							</option>
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
						value={String(createSeedActivity?.quantity ?? 0)}
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
