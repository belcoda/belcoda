<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import {
		languageCodes,
		getLocalizedLanguageName,
		getEnglishLanguageName
	} from '$lib/utils/language';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { t } from '$lib/index.svelte';

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

	const languages = $derived(
		languageCodes.map((l) => ({
			value: l,
			label: getLocalizedLanguageName(l),
			englishName: getEnglishLanguageName(l)
		}))
	);

	const selectedValue = $derived(languages.find((l) => l.value === value)?.label);

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
				{selectedValue || t`Select a language`}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root {...props}>
			<Command.Input placeholder={t`Search language...`} />
			<Command.List>
				<Command.Empty>{t`No languages found.`}</Command.Empty>
				<Command.Group value="languages">
					{#each languages as language (language.value)}
						<Command.Item
							value={language.value}
							keywords={[language.label, language.englishName]}
							onSelect={() => {
								value = language.value;
								onSelectChange?.(language.value);
								closeAndFocusTrigger();
							}}
						>
							<CheckIcon class={cn(value !== language.value && 'text-transparent')} />
							{language.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
