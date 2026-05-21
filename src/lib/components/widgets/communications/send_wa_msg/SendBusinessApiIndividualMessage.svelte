<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	const { personId }: { personId: string } = $props();
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
</script>

<InputGroup.Root>
	<InputGroup.Textarea placeholder="Write your message..." />
	<InputGroup.Addon align="block-end">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<InputGroup.Button variant="outline" class="rounded-full" size="icon-xs">
					<PlusIcon />
				</InputGroup.Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item><ImagePlusIcon /> Add image</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<InputGroup.Button variant="default" class="ml-auto rounded-full" size="icon-xs" disabled>
			<ArrowUpIcon />
			<span class="sr-only">Send</span>
		</InputGroup.Button>
	</InputGroup.Addon>
</InputGroup.Root>
