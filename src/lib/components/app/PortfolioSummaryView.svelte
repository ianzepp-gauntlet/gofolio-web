<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import Value from './Value.svelte';
	import type { PortfolioSummary } from '$lib/types/api';

	interface Props {
		summary: PortfolioSummary;
		baseCurrency: string;
	}

	let { summary, baseCurrency }: Props = $props();

	let emergencyFundPercent = $derived.by(() => {
		if (!summary.emergencyFund || summary.emergencyFund.total <= 0) return null;
		const pct =
			(summary.emergencyFund.assets + summary.emergencyFund.cash) / summary.emergencyFund.total;
		return Math.min(pct * 100, 100);
	});
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Total Investment</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.totalInvestment} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Total Buy</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.totalBuy} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Total Sell</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.totalSell} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Current Value</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.currentValueInBaseCurrency} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Net Performance</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.netPerformanceWithCurrencyEffect} currency={baseCurrency} colorized />
			</p>
			<p class="text-muted-foreground text-sm">
				<Value
					value={summary.netPerformancePercentageWithCurrencyEffect}
					type="percent"
					colorized
				/>
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Annualized Performance</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value
					value={summary.annualizedPerformancePercentWithCurrencyEffect}
					type="percent"
					colorized
				/>
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Dividend Income</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.dividendInBaseCurrency} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Fees Paid</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.fees} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Cash</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.cash} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Activities</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.activityCount} type="number" precision={0} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Interest</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.interestInBaseCurrency} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Excluded Accounts & Activities</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.excludedAccountsAndActivities} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Liabilities</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-2xl font-bold">
				<Value value={summary.liabilitiesInBaseCurrency} currency={baseCurrency} />
			</p>
		</Card.Content>
	</Card.Root>

	{#if emergencyFundPercent != null}
		<Card.Root class="sm:col-span-2 lg:col-span-3">
			<Card.Header class="pb-2">
				<Card.Description>Emergency Fund</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-2">
				<div class="grid gap-2 sm:grid-cols-3">
					<div>
						<p class="text-muted-foreground text-xs">Target</p>
						<p class="font-semibold">
							<Value value={summary.emergencyFund?.total ?? 0} currency={baseCurrency} />
						</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Cash</p>
						<p class="font-semibold">
							<Value value={summary.emergencyFund?.cash ?? 0} currency={baseCurrency} />
						</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Assets</p>
						<p class="font-semibold">
							<Value value={summary.emergencyFund?.assets ?? 0} currency={baseCurrency} />
						</p>
					</div>
				</div>
				<Progress value={emergencyFundPercent} />
				<p class="text-muted-foreground text-sm">
					{emergencyFundPercent.toFixed(0)}% funded
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
