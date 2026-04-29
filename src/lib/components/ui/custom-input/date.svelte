<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	let {
		value = $bindable(),
		onChange
	}: {
		value: number | undefined | null;
		onChange?: (value: number) => void;
	} = $props();

	function timestampToInputValue(timestamp: number): string {
		const savedTimestamp = timestamp; // Example for May 15, 1995
		const date = new Date(savedTimestamp);

		// Extract parts using UTC methods to keep it "timezone independent"
		const y = date.getUTCFullYear();
		const m = String(date.getUTCMonth() + 1).padStart(2, '0');
		const d = String(date.getUTCDate()).padStart(2, '0');

		const displayValue = `${y}-${m}-${d}`; // "1995-05-15"
		return displayValue;
	}

	function inputValueToTimestamp(inputValue: string): number {
		// Input value is "YYYY-MM-DD"
		const dateString = inputValue;

		// Create a date object using UTC to avoid offset shifts
		const [year, month, day] = dateString.split('-').map(Number);
		const utcDate = new Date(Date.UTC(year, month - 1, day));

		// This is the value you send to Zero Sync
		const unixTimestamp = utcDate.getTime();
		return unixTimestamp;
	}

	let rawValue = $state<string | undefined>(value ? timestampToInputValue(value) : undefined);

	function getValue() {
		return rawValue;
	}
	function setValue(newValue: string) {
		rawValue = newValue;
		value = inputValueToTimestamp(newValue);
	}
</script>

<Input fallbackValue="" type="date" bind:value={getValue as () => string, setValue} />
