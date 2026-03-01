<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Value from '$lib/components/app/Value.svelte';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let baseCurrency = $derived(data.user?.settings?.baseCurrency ?? 'USD');
	let summary = $derived(data.details?.summary ?? null);

	// Calculator state
	let safeWithdrawalRate = $state(0.04);
	let annualInterestRate = $state(0.07);
	let savingsRate = $state(0);
	let projectedTotalAmount = $state(0);

	const swrOptions = [0.025, 0.03, 0.035, 0.04, 0.045];

	let fireWealth = $derived(summary?.currentNetWorth ?? summary?.currentValueInBaseCurrency ?? 0);

	// Sustainable withdrawal income
	let yearlyIncome = $derived(fireWealth * safeWithdrawalRate);
	let monthlyIncome = $derived(yearlyIncome / 12);

	// Projected values
	let projectedYearlyIncome = $derived(
		projectedTotalAmount > 0 ? projectedTotalAmount * safeWithdrawalRate : 0
	);
	let projectedMonthlyIncome = $derived(projectedYearlyIncome / 12);

	// FI target (25x annual expenses based on SWR)
	let fiTarget = $derived(savingsRate > 0 ? (savingsRate * 12) / safeWithdrawalRate : 0);
	let progress = $derived(fiTarget > 0 ? Math.min(fireWealth / fiTarget, 1) : 0);
</script>

<div class="space-y-6">
	<!-- Current Status -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Current Wealth</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value value={fireWealth} currency={baseCurrency} />
				</p>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Sustainable Income / Year</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value value={yearlyIncome} currency={baseCurrency} />
				</p>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Sustainable Income / Month</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-xl font-semibold">
					<Value value={monthlyIncome} currency={baseCurrency} />
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Calculator -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">FIRE Calculator</Card.Title>
			<Card.Description>Configure your parameters to project your financial independence.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/updateFireSettings" use:enhance class="space-y-4">
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="safeWithdrawalRate">Safe Withdrawal Rate</Label>
						<select
							id="safeWithdrawalRate"
							name="safeWithdrawalRate"
							class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
							bind:value={safeWithdrawalRate}
						>
							{#each swrOptions as rate (rate)}
								<option value={rate}>{(rate * 100).toFixed(1)}%</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="annualInterestRate">Annual Interest Rate</Label>
						<Input
							id="annualInterestRate"
							name="annualInterestRate"
							type="number"
							step="0.01"
							bind:value={annualInterestRate}
						/>
					</div>

					<div class="space-y-2">
						<Label for="savingsRate">Monthly Savings Rate</Label>
						<Input
							id="savingsRate"
							name="savingsRate"
							type="number"
							step="100"
							bind:value={savingsRate}
						/>
					</div>

					<div class="space-y-2">
						<Label for="projectedTotalAmount">Projected Total Amount</Label>
						<Input
							id="projectedTotalAmount"
							name="projectedTotalAmount"
							type="number"
							step="1000"
							bind:value={projectedTotalAmount}
						/>
					</div>

					<div class="space-y-2">
						<Label for="retirementDate">Target Retirement Date</Label>
						<Input id="retirementDate" name="retirementDate" type="date" />
					</div>
				</div>

				<div class="flex justify-end">
					<Button type="submit" size="sm">Save Settings</Button>
				</div>

				{#if form?.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}
				{#if form?.success}
					<p class="text-muted-foreground text-sm">Settings saved.</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Projected -->
	{#if projectedTotalAmount > 0}
		<div class="grid gap-4 sm:grid-cols-2">
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Projected Income / Year</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-xl font-semibold">
						<Value value={projectedYearlyIncome} currency={baseCurrency} />
					</p>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Projected Income / Month</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-xl font-semibold">
						<Value value={projectedMonthlyIncome} currency={baseCurrency} />
					</p>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}

	<!-- Progress Bar -->
	{#if fiTarget > 0}
		<Card.Root>
			<Card.Content class="py-4">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">FI Progress</span>
					<span class="text-muted-foreground text-sm">{Math.round(progress * 100)}%</span>
				</div>
				<div class="bg-muted mt-2 h-3 w-full overflow-hidden rounded-full">
					<div
						class="bg-primary h-full rounded-full transition-all"
						style="width: {Math.round(progress * 100)}%"
					></div>
				</div>
				<p class="text-muted-foreground mt-1 text-xs">
					<Value value={fireWealth} currency={baseCurrency} /> of
					<Value value={fiTarget} currency={baseCurrency} /> target
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
