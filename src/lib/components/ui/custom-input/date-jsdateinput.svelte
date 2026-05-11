<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	let {
		value = $bindable(),
		onChange
	}: {
		value: Date | undefined | null;
		onChange?: (value: Date) => void;
	} = $props();

	function dateToInputValue(inputDate: Date): string {
		const date = inputDate; // Example for May 15, 1995

		// Extract parts using UTC methods to keep it "timezone independent"
		const y = date.getUTCFullYear();
		const m = String(date.getUTCMonth() + 1).padStart(2, '0');
		const d = String(date.getUTCDate()).padStart(2, '0');

		const displayValue = `${y}-${m}-${d}`; // "1995-05-15"
		return displayValue;
	}

	function inputValueToDate(inputValue: string): Date {
		// Input value is "YYYY-MM-DD"
		const dateString = inputValue;

		// Create a date object using UTC to avoid offset shifts
		const [year, month, day] = dateString.split('-').map(Number);
		const utcDate = new Date(Date.UTC(year, month - 1, day));

		return utcDate;
	}

	let rawValue = $state<string | undefined>(value ? dateToInputValue(value) : undefined);

	function getValue() {
		return rawValue;
	}
	function setValue(newValue: string) {
		rawValue = newValue;
		value = inputValueToDate(newValue);
	}
</script>

<Input fallbackValue="" type="date" bind:value={getValue as () => string, setValue} />
