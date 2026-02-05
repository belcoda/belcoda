<script lang="ts">
	import { type Snippet } from 'svelte';
	import CopyButton from '$lib/components/widgets/utils/CopyButton.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	type Props = {
		children: Snippet;
		action?: Snippet;
		title: string;
		separator: boolean;
		showCopyButton?: boolean;
		copyText?: string | null;
		edit: boolean;
	};
	let {
		children,
		action,
		title,
		separator = true,
		showCopyButton = true,
		copyText = null,
		edit = $bindable(false)
	}: Props = $props();
	import { Button } from '$lib/components/ui/button/index.js';
	import { t } from '$lib/index.svelte';
</script>

<div class="items-start gap-4 md:flex">
	<div class="ms-1 mt-2 mb-1 w-1/4 text-sm font-medium text-foreground">{title}</div>
	<div class="justify between mt-2 flex w-full items-start text-sm">
		<div class="grow">{@render children?.()}</div>
		<div class="flex items-center justify-end gap-2">
			{#if action}
				{@render action?.()}
			{:else if !edit}
				{#if showCopyButton}
					<CopyButton text={copyText} />
				{/if}
				<Button variant="outline" size="sm" onclick={() => (edit = true)}>Edit</Button>
			{/if}
		</div>
	</div>
</div>
{#if separator}
	<Separator />
{/if}
