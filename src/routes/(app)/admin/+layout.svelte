<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const tabs = [
		{ href: '/admin/overview', label: 'Overview' },
		{ href: '/admin/jobs', label: 'Jobs' },
		{ href: '/admin/market-data', label: 'Market Data' },
		{ href: '/admin/settings', label: 'Settings' },
		{ href: '/admin/users', label: 'Users' }
	];

	function isActive(href: string): boolean {
		return $page.url.pathname === href;
	}
</script>

<div class="space-y-3">
	<nav class="border-border overflow-x-auto rounded-md border p-1">
		<div class="flex min-w-max items-center gap-1">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors {isActive(tab.href)
						? 'bg-accent text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{tab.label}
				</a>
			{/each}
		</div>
	</nav>

	{@render children()}
</div>
