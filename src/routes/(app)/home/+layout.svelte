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

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="gf-tabs-page">
	<nav class="gf-tab-sidebar">
		<!-- Mobile: horizontal bottom bar -->
		<div class="flex items-center justify-center gap-1 sm:hidden">
			{#each tabs as tab (tab.value)}
				<a
					href={tab.href}
					class="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors
						{isActive(tab.href)
						? 'text-foreground font-medium'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<tab.icon class="h-5 w-5" />
				</a>
			{/each}
		</div>
		<!-- Desktop: vertical sidebar -->
		<div class="bg-foreground/[0.02] hidden flex-col sm:flex">
			{#each tabs as tab (tab.value)}
				<a
					href={tab.href}
					class="flex items-center gap-2 px-4 py-2 text-sm transition-colors
						{isActive(tab.href)
						? 'text-foreground font-medium'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<tab.icon class="h-4 w-4" />
					<span>{tab.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<div class="gf-tab-content">
		<div class="mx-auto w-full max-w-5xl px-4">
			{@render children()}
		</div>
	</div>
</div>
