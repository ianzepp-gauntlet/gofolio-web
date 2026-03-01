<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { Settings, Diamond, Key } from '@lucide/svelte';

	let { children }: { children: Snippet } = $props();

	const tabs = [
		{ href: '/account', label: 'Settings', icon: Settings, exact: true },
		{ href: '/account/membership', label: 'Membership', icon: Diamond, exact: true },
		{ href: '/account/access', label: 'Access', icon: Key, exact: true }
	];

	function isActive(href: string, exact: boolean): boolean {
		return exact ? $page.url.pathname === href : $page.url.pathname.startsWith(href);
	}
</script>

<div class="gf-tabs-page">
	<nav class="gf-tab-sidebar">
		<div class="flex items-center justify-center gap-1 sm:hidden">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors
						{isActive(tab.href, tab.exact)
						? 'text-foreground font-medium'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<tab.icon class="h-5 w-5" />
				</a>
			{/each}
		</div>
		<div class="bg-foreground/[0.02] hidden flex-col sm:flex">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="flex items-center gap-2 px-4 py-2 text-sm transition-colors
						{isActive(tab.href, tab.exact)
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
