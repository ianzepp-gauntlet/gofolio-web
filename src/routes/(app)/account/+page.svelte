<script lang="ts">
	import type { ActionData, PageData } from './$types';
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
		<section>
			<h3 class="mb-3 text-sm font-medium">Settings</h3>
			<div class="space-y-4">
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
			</div>
		</section>
	</form>

	<!-- User Info -->
	<section>
		<h3 class="mb-3 text-sm font-medium">User ID</h3>
		<code class="bg-muted rounded px-2 py-1 text-xs">{data.user.id}</code>
	</section>

	<!-- Export -->
	<section>
		<h3 class="mb-3 text-sm font-medium">Export Data</h3>
		<p class="text-muted-foreground mb-3 text-sm">Download all your data as JSON.</p>
		<a href="/api/v1/export" download="gofolio-export.json">
			<Button variant="outline" size="sm">Export</Button>
		</a>
	</section>

	<!-- Danger Zone -->
	<section>
		<h3 class="text-destructive mb-3 text-sm font-medium">Danger Zone</h3>
		<p class="text-muted-foreground mb-3 text-sm">Once you delete your account, there is no going back.</p>
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
	</section>
</div>
