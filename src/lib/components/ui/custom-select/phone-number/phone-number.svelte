<script lang="ts">
	import {
		countryCodes,
		renderLocalizedCountryName,
		type CountryCode,
		defaultCountryCode
	} from '$lib/utils/country';
	import {
		getPhoneNumberExample,
		getDialingCode,
		getInternationalPhoneNumber,
		safeGetCountryCodeFromPhoneNumber,
		renderLocalPhoneNumber,
		isValidInternationalPhoneNumber
	} from '$lib/utils/phone';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { locale, t } from '$lib/index.svelte';
	import { cn } from '$lib/utils.js';

	import { tick } from 'svelte';
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	let {
		value = $bindable(undefined),
		valid = $bindable(false),
		country = $bindable(),
		class: className,
		...rest
	}: {
		value: string | null | undefined;
		valid?: boolean;
		country: CountryCode;
		class?: string;
	} = $props();

	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';

	const unsortedOptions = countryCodes.map((item) => {
		return {
			value: item,
			code: getDialingCode(item),
			label: `${renderLocalizedCountryName(item, locale.current)}`
		};
	});
	const options = [...unsortedOptions].sort((a, b) => a.label.localeCompare(b.label));

	//component state

	let selectedCountry = $state(safeGetCountryCodeFromPhoneNumber(value || '') || country);
	let phoneNumber = $state(
		value ? renderLocalPhoneNumber(value, (() => selectedCountry)()) : value
	);
	let validInternationalPhoneNumber = $derived.by(() =>
		isValidInternationalPhoneNumber(phoneNumber || '', selectedCountry || defaultCountryCode, true)
	);

	valid = (() => validInternationalPhoneNumber)();
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null!);

	function getValue() {
		return phoneNumber as string;
	}
	function setValue(newValue: string) {
		const internationalPhoneNumber = getInternationalPhoneNumber(
			newValue,
			selectedCountry || defaultCountryCode
		);
		phoneNumber = newValue;
		value = internationalPhoneNumber;
		valid = validInternationalPhoneNumber;
	}

	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CheckIcon from '@lucide/svelte/icons/check';

	const phonePlaceholder = $derived.by(() => {
		if (!selectedCountry) return t`Phone number`;
		const selectedOption = options.find((item) => item.value === selectedCountry);
		if (!selectedOption) return t`Phone number`;
		const ph = getPhoneNumberExample(selectedOption.value).number?.national;
		if (!ph) return t`Phone number`;
		return ph;
	});
</script>

<div class="flex items-center gap-2">
	<div class="grow">
		<InputGroup.Root {...rest}>
			<InputGroup.Input
				bind:ref={triggerRef}
				type="tel"
				placeholder={phonePlaceholder}
				bind:value={getValue, setValue}
			/>
			<InputGroup.Addon align="inline-start">
				<Popover.Root bind:open>
					<Popover.Trigger>
						{#snippet child({ props })}
							<InputGroup.Button
								{...props}
								variant="ghost"
								size="xs"
								aria-label={t`Select a country`}
								role="combobox"
								aria-expanded={open}
							>
								{#if selectedCountry}
									<img
										src={`/images/icons/flags/svg/${selectedCountry}.svg`}
										alt={selectedCountry}
										class="me-1 size-4"
									/>
									({getDialingCode(selectedCountry)})
								{:else}
									{t`Select a country`}
								{/if}
								<ChevronsUpDownIcon class="opacity-50" />
							</InputGroup.Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="p-0">
						<Command.Root>
							<Command.Input placeholder={t`Search country...`} />
							<Command.List>
								<Command.Empty>{t`No countries found.`}</Command.Empty>
								<Command.Group value="countries">
									{#each options as option (option.value)}
										<Command.Item
											keywords={[option.label, option.code]}
											value={option.value}
											onSelect={() => {
												selectedCountry = option.value;
												phoneNumber = undefined;
												closeAndFocusTrigger();
											}}
										>
											<CheckIcon
												class={cn(selectedCountry !== option.value && 'text-transparent')}
											/>
											<div class="flex items-center gap-1">
												({option.code}) {option.label}
											</div>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</InputGroup.Addon>
			{#if validInternationalPhoneNumber}
				<InputGroup.Addon align="inline-end">
					<CheckIcon />
				</InputGroup.Addon>
			{/if}
		</InputGroup.Root>
	</div>
</div>

{#snippet countrySelect()}{/snippet}
