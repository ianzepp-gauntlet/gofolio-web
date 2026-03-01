<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const ranges = ['1d', '1w', '1m', '3m', '6m', '1y', 'ytd', 'max'];
	const locales = ['de', 'de-CH', 'en-GB', 'en-US', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr'];
	const viewModes = [
		{ value: 'DEFAULT', label: 'Default' },
		{ value: 'ZEN', label: 'Zen' }
	];

	let showDangerZone = $state(false);
</script>

<div class="space-y-6">
	<!-- Settings Form -->
	<form method="POST" action="?/updateSettings" use:enhance>
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Settings</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="baseCurrency">Base Currency</Label>
						<select
							id="baseCurrency"
							name="baseCurrency"
							class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
						>
							{#each data.info.currencies as currency (currency)}
								<option
									value={currency}
									selected={currency === data.user.settings.baseCurrency}
								>
									{currency}
								</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="locale">Locale</Label>
						<select
							id="locale"
							name="locale"
							class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
						>
							{#each locales as loc (loc)}
								<option value={loc} selected={loc === (data.user.settings.locale ?? 'en-US')}>
									{loc}
								</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="dateRange">Default Date Range</Label>
						<select
							id="dateRange"
							name="dateRange"
							class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
						>
							{#each ranges as range (range)}
								<option
									value={range}
									selected={range === (data.user.settings.dateRange ?? 'max')}
								>
									{range.toUpperCase()}
								</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="colorScheme">Appearance</Label>
						<select
							id="colorScheme"
							name="colorScheme"
							class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
						>
							<option value="LIGHT" selected={data.user.settings.colorScheme !== 'DARK'}>
								Light
							</option>
							<option value="DARK" selected={data.user.settings.colorScheme === 'DARK'}>
								Dark
							</option>
						</select>
					</div>

					<div class="space-y-2">
						<Label for="viewMode">View Mode</Label>
						<select
							id="viewMode"
							name="viewMode"
							class="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
						>
							{#each viewModes as mode (mode.value)}
								<option
									value={mode.value}
									selected={mode.value === (data.user.settings.viewMode ?? 'DEFAULT')}
								>
									{mode.label}
								</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="space-y-3">
					<label class="inline-flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							name="isRestrictedView"
							class="h-4 w-4"
							checked={data.user.settings.isRestrictedView ?? false}
						/>
						Presenter View (hides portfolio values)
					</label>
				</div>

				{#if form?.action === 'updateSettings' && form?.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}

				<div class="flex justify-end">
					<Button type="submit">Save Settings</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</form>

	<!-- User Info -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">User ID</Card.Title>
		</Card.Header>
		<Card.Content>
			<code class="bg-muted rounded px-2 py-1 text-xs">{data.user.id}</code>
		</Card.Content>
	</Card.Root>

	<!-- Export -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Export Data</Card.Title>
			<Card.Description>Download all your data as JSON.</Card.Description>
		</Card.Header>
		<Card.Content>
			<a href="/api/v1/export" download="gofolio-export.json">
				<Button variant="outline" size="sm">Export</Button>
			</a>
		</Card.Content>
	</Card.Root>

	<!-- Danger Zone -->
	<Card.Root class="border-destructive/50">
		<Card.Header>
			<Card.Title class="text-destructive text-base">Danger Zone</Card.Title>
			<Card.Description>Once you delete your account, there is no going back.</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button variant="destructive" size="sm" onclick={() => (showDangerZone = !showDangerZone)}>
				{showDangerZone ? 'Cancel' : 'Delete Account'}
			</Button>

			{#if showDangerZone}
				<form method="POST" action="?/deleteAccount" use:enhance class="mt-4 space-y-2">
					<Label for="securityToken">Enter your security token to confirm</Label>
					<Input id="securityToken" name="securityToken" type="password" required class="max-w-xs" />
					<Button type="submit" variant="destructive" size="sm">Permanently Delete</Button>
				</form>
			{/if}

			{#if form?.action === 'deleteAccount' && form?.error}
				<p class="text-destructive mt-2 text-sm">{form.error}</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
