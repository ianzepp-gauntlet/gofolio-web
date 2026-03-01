<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showRedeem = $state(false);

	const subscription = data.user.subscription;
	const isPremium = subscription?.type === 'Premium';
</script>

<div class="space-y-6">
	<!-- Current Membership -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Membership</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex items-center gap-3">
				<Badge variant={isPremium ? 'default' : 'secondary'}>
					{subscription?.type ?? 'Basic'}
				</Badge>
				{#if subscription?.expiresAt}
					<span class="text-muted-foreground text-sm">
						Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
					</span>
				{/if}
			</div>

			{#if !isPremium}
				<p class="text-muted-foreground text-sm">
					Upgrade to Premium to unlock all features including X-Ray analysis, allocation breakdowns,
					and advanced reports.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Redeem Coupon -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Redeem Coupon</Card.Title>
			<Card.Description>Enter a coupon code to extend or activate your subscription.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.error}
				<p class="text-destructive mb-2 text-sm">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="mb-2 text-sm text-green-600">Coupon redeemed successfully!</p>
			{/if}

			{#if showRedeem}
				<form method="POST" action="?/redeemCoupon" use:enhance class="flex items-end gap-2">
					<div class="space-y-1">
						<label for="couponCode" class="text-xs font-medium">Coupon Code</label>
						<Input id="couponCode" name="couponCode" required class="w-64" />
					</div>
					<Button type="submit" size="sm">Redeem</Button>
					<Button type="button" variant="ghost" size="sm" onclick={() => (showRedeem = false)}>Cancel</Button>
				</form>
			{:else}
				<Button variant="outline" size="sm" onclick={() => (showRedeem = true)}>
					Enter Coupon Code
				</Button>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
