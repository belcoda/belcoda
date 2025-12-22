<script lang="ts">
	import { default as SuperDebug, type SuperForm } from 'sveltekit-superforms';
	type Props<T extends Record<string, unknown>> = {
		data: unknown;
		hide?: boolean;
	};
	const { data, hide = false }: Props<any> = $props();
	import { dev } from '$app/environment';
</script>

{#if dev && hide !== true}
	<div class="my-4"><SuperDebug {data} /></div>
{/if}
