<script lang="ts">
	import AppHeader from '$lib/components/app/AppHeader.svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<AppHeader info={data.info} user={data.user} />
	<main class="flex-1">
		<div class="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-5">
			{@render children()}
		</div>
	</main>
</div>
