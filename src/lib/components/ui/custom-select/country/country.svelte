<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { countryCodes, renderLocalizedCountryName } from '$lib/utils/country';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { locale, t } from '$lib/index.svelte';

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

	const countries = $derived(
		countryCodes.map((c) => ({
			value: c,
			label: renderLocalizedCountryName(c, locale.current)
		}))
	);

	const selectedValue = $derived(countries.find((c) => c.value === value)?.label);

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
				class="w-full justify-between"
				role="combobox"
				aria-expanded={open}
			>
				<div class="flex items-center gap-2">
					<img src={`/images/icons/flags/svg/${value}.svg`} alt={value} class="size-4" />
					{selectedValue || t`Select a country`}
				</div>
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root {...props}>
			<Command.Input placeholder={t`Search country...`} />
			<Command.List>
				<Command.Empty>{t`No countries found.`}</Command.Empty>
				<Command.Group value="countries">
					{#each countries as country (country.value)}
						<Command.Item
							keywords={[country.label]}
							value={country.value}
							onSelect={() => {
								value = country.value;
								onSelectChange?.(country.value);
								closeAndFocusTrigger();
							}}
						>
							<CheckIcon class={cn(value !== country.value && 'text-transparent')} />
							{country.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
