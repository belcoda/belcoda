<script lang="ts">
	import IconCopy from '@lucide/svelte/icons/copy';
	import IconRefresh from '@lucide/svelte/icons/refresh-cw';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	const { petition }: { petition: ReadPetitionZero } = $props();
	import { t } from '$lib/index.svelte';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { toast } from 'svelte-sonner';
	import CheckIcon from '@lucide/svelte/icons/check';
	let copied = $state(false);
	type Layout = 'default';
	let layout: Layout = $state('default');

	import { appState } from '$lib/state.svelte';
	import { getPetitionLink } from '$lib/utils/petitions/link';
	const petitionLink = $derived(
		getPetitionLink({
			petitionSlug: petition.slug,
			organizationSlug: appState.activeOrganization.data?.slug || ''
		})
	);

	const embedCode = $derived.by(() => {
		switch (layout) {
			case 'default':
				return `<iframe src="${petitionLink}?layout=embed" width="100%" height="600" frameborder="0"></iframe>`;
		}
	});
</script>

<div class="grid w-full max-w-md gap-4">
	<InputGroup.Root class="w-full overflow-x-auto">
		<InputGroup.Addon align="block-start" class="border-b">
			<InputGroup.Text class="font-medium text-foreground"
				>{t`Copy to embed in your website`}</InputGroup.Text
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
						checked={layout === 'default'}
						onCheckedChange={() => (layout = 'default')}
						>{t`Default layout`}</DropdownMenu.CheckboxItem
					>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<InputGroup.Button
				variant="ghost"
				size="icon-xs"
				onclick={() => {
					navigator.clipboard.writeText(embedCode);
					toast.success(t`Copied to clipboard`);
					copied = true;
					setTimeout(() => {
						copied = false;
					}, 1000);
				}}
			>
				{#if copied}<CheckIcon />{:else}<IconCopy />{/if}
			</InputGroup.Button>
		</InputGroup.Addon>
		<InputGroup.Textarea value={embedCode} class="min-h-[200px] font-mono text-xs" readonly />
	</InputGroup.Root>
</div>
