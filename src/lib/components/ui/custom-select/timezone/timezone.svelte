<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { getTimeZonesWithOffsets, formatTimezone } from './actions';

	import { locale, t } from '$lib/index.svelte';
	const timezones = getTimeZonesWithOffsets(locale.current);

	let open = $state(false);

	let {
		value = $bindable(undefined),
		triggerRef = $bindable(null!),
		onSelectChange,
		...props
	}: {
		value: string | undefined;
		triggerRef?: HTMLButtonElement | null;
		onSelectChange?: (value: string) => void;
	} = $props();

	const selectedValue = $derived(timezones.find((t) => t.value === value)?.label);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="justify-between"
				role="combobox"
				aria-expanded={open}
			>
				{selectedValue || t`Select a timezone...`}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root {...props}>
			<Command.Input placeholder={t`Search timezone...`} />
			<Command.List>
				<Command.Empty>{t`No timezones found.`}</Command.Empty>
				<Command.Group value="timezones">
					{#each timezones as timezone (timezone.value)}
						<Command.Item
							value={timezone.value}
							onSelect={() => {
								value = timezone.value;
								onSelectChange?.(timezone.value);
								closeAndFocusTrigger();
							}}
						>
							<CheckIcon class={cn(value !== timezone.value && 'text-transparent')} />
							{timezone.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
