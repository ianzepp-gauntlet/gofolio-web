<script lang="ts">
	interface Props {
		dataSource?: string;
		symbol?: string;
		url?: string;
		name?: string;
		size?: number;
	}

	let { dataSource, symbol, url, name = '', size = 18 }: Props = $props();

	function initials(label: string): string {
		const trimmed = label.trim();
		if (!trimmed) return '?';
		const words = trimmed.split(/\s+/).filter(Boolean);
		if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
		return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
	}

	function getImageSrc(): string | null {
		if (dataSource && symbol) {
			return `/api/v1/logo/${encodeURIComponent(dataSource)}/${encodeURIComponent(symbol)}`;
		}
		if (url) {
			try {
				const parsed = new URL(url);
				return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=64`;
			} catch {
				return null;
			}
		}
		return null;
	}

	let imageSrc = $derived(getImageSrc());
	let imageFailed = $state(false);
</script>

<span
	class="bg-muted text-muted-foreground inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm"
	style={`width:${size}px;height:${size}px;`}
	title={name || symbol || ''}
>
	{#if imageSrc && !imageFailed}
		<img
			src={imageSrc}
			alt={name || symbol || 'entity logo'}
			class="h-full w-full object-cover"
			onerror={() => (imageFailed = true)}
		/>
	{:else}
		<span class="text-[10px] font-semibold">{initials(name || symbol || '')}</span>
	{/if}
</span>
