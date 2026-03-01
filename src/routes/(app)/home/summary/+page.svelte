<script lang="ts">
	import type { PageData } from './$types';
	import type { ActionData } from './$types';
	import type { LayoutData } from '../../$types';
	import PortfolioSummaryView from '$lib/components/app/PortfolioSummaryView.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data, form }: { data: PageData & LayoutData; form: ActionData } = $props();

	let baseCurrency = $derived(data.info?.baseCurrency ?? 'USD');
	let canUpdateEmergencyFund = $derived(
		data.user.permissions.includes('updateUserSettings') && !data.user.settings?.isRestrictedView
	);
</script>

<div class="space-y-4">
	<h1 class="hidden text-center text-2xl font-semibold sm:block">Summary</h1>
	<div class="mx-auto w-full max-w-4xl">
		<Card.Root>
			<Card.Content class="p-4 md:p-6">
				{#if data.summary}
					<PortfolioSummaryView summary={data.summary} {baseCurrency} />
					{#if canUpdateEmergencyFund}
						<form method="POST" action="?/emergencyFund" class="mt-5 border-t pt-4">
							<div class="space-y-2">
								<Label for="emergencyFund">Emergency Fund Target</Label>
								<div class="flex items-center gap-2">
									<Input
										id="emergencyFund"
										name="emergencyFund"
										type="number"
										min="0"
										step="0.01"
										value={String(data.summary.emergencyFund?.total ?? 0)}
										required
									/>
									<span class="text-muted-foreground text-sm">{baseCurrency}</span>
									<Button type="submit" variant="outline">Save</Button>
								</div>
							</div>
							{#if form?.action === 'emergencyFund' && form?.error}
								<p class="text-destructive mt-2 text-sm">{form.error}</p>
							{/if}
						</form>
					{/if}
				{:else}
					<div class="space-y-3 py-4">
						<div class="bg-muted/40 h-8 w-64 animate-pulse rounded-md mx-auto"></div>
						<div class="bg-muted/40 h-5 w-80 animate-pulse rounded-md mx-auto"></div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
