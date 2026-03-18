<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import {
		formatTime24to12,
		parseForgivingTime,
		isInvalid,
		generateTimeOptions,
		toNativeTimeValue,
		fromNativeTimeValue,
		type TimeLimit
	} from './time-utils';
	import { t } from '$lib/index.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	const isMobile = new IsMobile(768);

	let {
		hour = $bindable(0),
		minute = $bindable(0),
		disallowBefore = null as TimeLimit | null,
		step = 15,
		placeholder = 'Select time',
		class: className,
		id,
		...restProps
	}: {
		hour?: number;
		minute?: number;
		disallowBefore?: TimeLimit | null;
		step?: number;
		placeholder?: string;
		class?: string;
		id?: string;
	} = $props();

	let open = $state(false);
	let searchValue = $state('');
	let lastInvalidInput = $state('');
	let triggerRef = $state<HTMLButtonElement | null>(null);
	let nativeInputRef = $state<HTMLInputElement | null>(null);

	const displayLabel = $derived(hour >= 0 && minute >= 0 ? formatTime24to12(hour, minute) : '');

	const timeOptions = $derived(generateTimeOptions(step, disallowBefore));

	// Filter options: if search parses to a time, show options at/after that time; else substring match
	const filteredOptions = $derived.by(() => {
		const search = searchValue.trim().toLowerCase();
		if (!search) return timeOptions;

		const parsed = parseForgivingTime(searchValue);
		if (parsed) {
			const totalMinutes = parsed.hour * 60 + parsed.minute;
			return timeOptions.filter((o) => o.hour * 60 + o.minute >= totalMinutes);
		}

		return timeOptions.filter((o) => o.label.toLowerCase().includes(search));
	});

	// Validation: manual entry that parses but is before disallowBefore
	const parsedFromLastInvalid = $derived(parseForgivingTime(lastInvalidInput));
	const showValidationError = $derived(
		!!lastInvalidInput &&
			!!parsedFromLastInvalid &&
			isInvalid(parsedFromLastInvalid.hour, parsedFromLastInvalid.minute, disallowBefore)
	);
	const invalidBorder = $derived(showValidationError);
	const errorMessage = $derived(
		showValidationError && disallowBefore
			? `Must be after ${formatTime24to12(disallowBefore.hour, disallowBefore.minute)}`
			: ''
	);

	// What to show in the trigger: valid formatted time, or invalid typed value
	const triggerDisplay = $derived(showValidationError ? lastInvalidInput : displayLabel);

	// Only update bound hour/minute when valid (not when showing validation error)
	function selectTime(h: number, m: number) {
		if (isInvalid(h, m, disallowBefore)) return;
		hour = h;
		minute = m;
		lastInvalidInput = '';
	}

	function closeAndFocusTrigger() {
		open = false;
		searchValue = '';
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	function handleCommandSelect(option: { hour: number; minute: number }) {
		selectTime(option.hour, option.minute);
		closeAndFocusTrigger();
	}

	function handleCommandKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && searchValue) {
			const parsed = parseForgivingTime(searchValue);
			if (parsed && !isInvalid(parsed.hour, parsed.minute, disallowBefore)) {
				selectTime(parsed.hour, parsed.minute);
				closeAndFocusTrigger();
				e.preventDefault();
			} else if (parsed && isInvalid(parsed.hour, parsed.minute, disallowBefore)) {
				lastInvalidInput = searchValue;
				closeAndFocusTrigger();
				e.preventDefault();
			}
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (isOpen) {
			searchValue = displayLabel || '';
			lastInvalidInput = '';
		} else {
			// On close, try to parse manual input and validate
			if (searchValue) {
				const parsed = parseForgivingTime(searchValue);
				if (parsed && !isInvalid(parsed.hour, parsed.minute, disallowBefore)) {
					selectTime(parsed.hour, parsed.minute);
				} else if (parsed && isInvalid(parsed.hour, parsed.minute, disallowBefore)) {
					lastInvalidInput = searchValue;
				}
			}
		}
	}

	function handleNativeTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const parsed = fromNativeTimeValue(target.value);
		if (parsed && !isInvalid(parsed.hour, parsed.minute, disallowBefore)) {
			hour = parsed.hour;
			minute = parsed.minute;
		}
	}

	// Find closest option index for scroll-into-view on open
	const closestOptionIndex = $derived.by(() => {
		const current = hour * 60 + minute;
		let best = 0;
		let bestDiff = Infinity;
		filteredOptions.forEach((o, i) => {
			const diff = Math.abs(o.hour * 60 + o.minute - current);
			if (diff < bestDiff) {
				bestDiff = diff;
				best = i;
			}
		});
		return best;
	});

	// Scroll closest time into view when dropdown opens
	$effect(() => {
		if (open && filteredOptions.length > 0) {
			tick().then(() => {
				const el = document.querySelector('[data-closest="true"]');
				el?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
			});
		}
	});
</script>

<div class="relative w-full" {...restProps}>
	{#if isMobile.current}
		<!-- Mobile: native time picker overlay -->
		<div class="relative">
			<button
				type="button"
				bind:this={triggerRef}
				class={cn(
					'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background',
					'placeholder:text-muted-foreground',
					'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
					invalidBorder && 'border-destructive ring-destructive/20',
					className
				)}
				aria-expanded={false}
				aria-haspopup="dialog"
			>
				<span class={triggerDisplay ? '' : 'text-muted-foreground'}>
					{triggerDisplay || placeholder}
				</span>
				<ChevronsUpDownIcon class="size-4 opacity-50" />
			</button>
			<input
				bind:this={nativeInputRef}
				type="time"
				value={toNativeTimeValue(hour, minute)}
				onchange={handleNativeTimeChange}
				class="absolute inset-0 size-full cursor-pointer opacity-0"
				aria-label={placeholder}
			/>
		</div>
	{:else}
		<!-- Desktop: combobox with Command -->
		<Popover.Root {open} onOpenChange={handleOpenChange}>
			<Popover.Trigger bind:ref={triggerRef} class={className}>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class={cn(
							'w-full justify-between font-normal',
							invalidBorder && 'border-destructive ring-destructive/20'
						)}
						role="combobox"
						aria-expanded={open}
						aria-invalid={invalidBorder}
						aria-describedby={id ? `${id}-error` : undefined}
					>
						<span class={triggerDisplay ? '' : 'text-muted-foreground'}>
							{triggerDisplay || placeholder}
						</span>
						<ChevronsUpDownIcon class="size-4 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[var(--bits-popover-trigger-width)] p-0" align="start">
				<div role="group" onkeydown={handleCommandKeyDown}>
					<Command.Root bind:value={searchValue} shouldFilter={false}>
						<Command.Input placeholder={t`Type or select time...`} />
						<Command.List class="max-h-[300px]">
							<Command.Empty>{t`No times found.`}</Command.Empty>
							<Command.Group value="times">
								{#each filteredOptions as option, i (option.label)}
									<Command.Item
										value={option.label}
										data-index={i}
										data-closest={i === closestOptionIndex}
										onSelect={() =>
											handleCommandSelect({ hour: option.hour, minute: option.minute })}
									>
										<CheckIcon
											class={cn(
												'size-4',
												hour === option.hour && minute === option.minute ? '' : 'text-transparent'
											)}
										/>
										{option.label}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</div>
			</Popover.Content>
		</Popover.Root>
	{/if}

	<!-- Validation error message (aria-live) -->
	{#if errorMessage}
		<div
			id={id ? `${id}-error` : undefined}
			class="mt-1 text-sm text-destructive"
			role="alert"
			aria-live="polite"
		>
			{errorMessage}
		</div>
	{/if}
</div>
