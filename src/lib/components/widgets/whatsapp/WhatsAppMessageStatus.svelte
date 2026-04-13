<script lang="ts">
	const { status }: { status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending' } = $props();
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Check from '@lucide/svelte/icons/check';
	import DoubleCheck from '@lucide/svelte/icons/check-check';
	import XIcon from '@lucide/svelte/icons/x';
</script>

<!-- The order of this is relatively important-->
{#if status === 'failed'}
	<XIcon class="size-4 text-red-400" />
{:else if status === 'read'}
	<DoubleCheck class="size-4 text-blue-500" />
{:else if status === 'delivered'}
	<DoubleCheck class="size-4" />
{:else if status === 'sent'}
	<Check class="size-4" />
{:else if status === 'pending'}
	<LoaderCircle class="size-3 animate-spin" />
{/if}
