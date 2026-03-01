<script lang="ts">
	import { page } from '$app/stores';
	import { ChartLine, LayoutList, ClipboardList, Star, TrendingUp } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const tabs = [
		{ value: 'overview', label: 'Overview', href: '/home/overview', icon: ChartLine },
		{ value: 'holdings', label: 'Holdings', href: '/home/holdings', icon: LayoutList },
		{ value: 'summary', label: 'Summary', href: '/home/summary', icon: ClipboardList },
		{ value: 'watchlist', label: 'Watchlist', href: '/home/watchlist', icon: Star },
		{ value: 'markets', label: 'Markets', href: '/home/markets', icon: TrendingUp }
	];

	let activeTab = $derived(
		tabs.find((t) => $page.url.pathname.startsWith(t.href))?.value ?? 'overview'
	);
</script>

<div class="flex min-h-[calc(100dvh-8.5rem)] flex-col">
	<div class="min-h-0 flex-1 overflow-auto pb-4">
		{@render children()}
	</div>

	<nav class="border-border mt-1 border-t pt-2">
		<div class="mx-auto flex w-full items-center justify-center gap-1">
			{#each tabs as tab (tab.value)}
				<a
					href={tab.href}
					class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-w-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none {activeTab ===
					tab.value
						? 'bg-accent text-foreground'
						: ''}"
				>
					<tab.icon class="h-5 w-5 sm:h-4 sm:w-4" />
					<span class="hidden sm:inline">{tab.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
