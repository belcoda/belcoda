<script lang="ts">
	import IconCopy from '@lucide/svelte/icons/copy';
	import IconRefresh from '@lucide/svelte/icons/refresh-cw';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { type ReadEventZero } from '$lib/schema/event';
	const { event }: { event: ReadEventZero } = $props();

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { toast } from 'svelte-sonner';
	import CheckIcon from '@lucide/svelte/icons/check';
	let copied = $state(false);
	type Theme = 'default';
	let theme: Theme = $state('default');
	const embedCode = $derived.by(() => {
		switch (theme) {
			case 'default':
				return `TODO: Generated embeddable iframe code for event ${event.title}`;
		}
	});
</script>

<div class="grid w-full max-w-md gap-4">
	<InputGroup.Root>
		<InputGroup.Addon align="block-start" class="border-b">
			<InputGroup.Text class="font-medium text-foreground"
				>Copy to embed in your website</InputGroup.Text
			>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<InputGroup.Button {...props} class="ms-auto" size="icon-xs">
							<IconRefresh />
						</InputGroup.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.CheckboxItem
						checked={theme === 'default'}
						onCheckedChange={() => (theme = 'default')}>Default theme</DropdownMenu.CheckboxItem
					>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<InputGroup.Button
				variant="ghost"
				size="icon-xs"
				onclick={() => {
					navigator.clipboard.writeText(embedCode);
					toast.success('Copied to clipboard');
					copied = true;
					setTimeout(() => {
						copied = false;
					}, 1000);
				}}
			>
				{#if copied}<CheckIcon />{:else}<IconCopy />{/if}
			</InputGroup.Button>
		</InputGroup.Addon>
		<InputGroup.Textarea value={embedCode} class="min-h-[200px] font-mono" readonly />
	</InputGroup.Root>
</div>
