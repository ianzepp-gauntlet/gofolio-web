<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-4">
	<h1 class="text-xl font-semibold">Admin Overview</h1>
	<div class="grid gap-4 md:grid-cols-2">
		<Card.Root>
			<Card.Header><Card.Description>Global Permissions</Card.Description></Card.Header>
			<Card.Content class="text-sm">{data.info.globalPermissions.length}</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header><Card.Description>Current User</Card.Description></Card.Header>
			<Card.Content class="font-mono text-xs">{data.user.id}</Card.Content>
		</Card.Root>
	</div>
</div>
