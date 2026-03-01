<script lang="ts">
	import type { PageData } from './$types';
	import type { LayoutData } from '../$types';
	import AccountsTable from '$lib/components/app/AccountsTable.svelte';

	let { data }: { data: PageData & { parent: LayoutData } } = $props();

	let parentData = $derived(data as PageData & LayoutData);
	let baseCurrency = $derived(parentData.info?.baseCurrency ?? 'USD');
</script>

<div class="space-y-4">
	<h1 class="hidden text-center text-2xl font-semibold sm:block">Accounts</h1>
	<div class="mx-auto w-full max-w-6xl space-y-3">
		<div class="flex justify-end">
			<button
				type="button"
				disabled
				title="Not available in this UI yet"
				class="border-input bg-background text-muted-foreground inline-flex h-9 items-center rounded-md border px-3 text-sm"
			>
				Transfer Cash Balance...
			</button>
		</div>
		<AccountsTable
			accounts={data.accounts}
			{baseCurrency}
			totalValue={data.totalValue}
			totalBalance={data.totalBalance}
		/>
	</div>
</div>
