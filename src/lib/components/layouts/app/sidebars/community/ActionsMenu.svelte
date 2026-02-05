<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
		<EllipsisIcon class="size-5" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a href="/community/person/new" {...props}> {t`New person`} </a>
				{/snippet}
			</DropdownMenu.Item>
			<DropdownMenu.Item>{t`Billing`}</DropdownMenu.Item>
			<DropdownMenu.Item>{t`Team`}</DropdownMenu.Item>
			<DropdownMenu.Item>{t`Subscription`}</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
