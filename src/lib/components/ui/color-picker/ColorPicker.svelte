<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils';
	import { t } from '$lib/index.svelte';

	type Props = {
		value?: string | null;
		onChange?: (value: string | null) => void;
		label?: string;
		description?: string;
		class?: string;
	};

	let { value = $bindable(null), onChange, label, description, class: className }: Props = $props();

	// Convert null to empty string for inputs, but keep null in state
	let displayValue = $derived(value || '');
	let colorInputValue = $derived(value || '#000000');

	function updateValue(newValue: string | null) {
		value = newValue;
		onChange?.(newValue);
	}

	function handleColorInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = target.value;
		updateValue(newValue || null);
	}

	function handleHexInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		let newValue = target.value.trim();

		// If empty, set to null
		if (newValue === '') {
			updateValue(null);
			return;
		}

		// Ensure it starts with #
		if (!newValue.startsWith('#')) {
			newValue = '#' + newValue;
		}

		// Basic validation - allow partial input
		updateValue(newValue || null);
	}

	function handleClear() {
		updateValue(null);
	}
</script>

<div class={cn('space-y-2', className)}>
	{#if label}
		<Label>{label}</Label>
	{/if}

	<div class="flex items-center gap-2">
		<!-- Color Preview Swatch -->
		<div
			class="h-9 w-9 shrink-0 rounded-md border border-input shadow-xs"
			style="background-color: {colorInputValue};"
			role="img"
			aria-label={t`Color preview`}
		></div>

		<!-- Color Picker -->
		<input
			type="color"
			value={colorInputValue}
			oninput={handleColorInputChange}
			class="h-9 w-12 cursor-pointer rounded-md border border-input shadow-xs"
			aria-label={t`Color picker`}
		/>

		<!-- Hex Text Input -->
		<Input
			type="text"
			value={displayValue}
			oninput={handleHexInputChange}
			placeholder="#000000"
			class="flex-1"
			aria-label={t`Hex color code`}
		/>

		<!-- Clear Button -->
		{#if value !== null}
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onclick={handleClear}
				class="h-9 w-9 shrink-0"
				aria-label={t`Clear color`}
			>
				<XIcon class="size-4" />
			</Button>
		{/if}
	</div>

	{#if description}
		<p class="text-sm text-muted-foreground">{description}</p>
	{/if}
</div>
