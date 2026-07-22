<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, today, CalendarDate } from '@internationalized/date';
	import { t } from '$lib/index.svelte';

	const id = $props.id();
	let { value = $bindable(null) }: { value: Date | null | undefined } = $props();

	// Derive the local calendar state from the incoming value without writing back to the
	// $bindable prop. Writes to the parent happen strictly from user interaction (setDate),
	// mirroring the safe getter/setter pattern used by date-jsdateinput.svelte.
	function toCalendarDate(input: Date | null | undefined): CalendarDate | undefined {
		if (!(input instanceof Date) || Number.isNaN(input.getTime())) {
			return undefined;
		}
		return new CalendarDate(input.getFullYear(), input.getMonth() + 1, input.getDate());
	}

	let open = $state(false);
	let dateValue = $state<CalendarDate | undefined>(toCalendarDate(value));

	function getDate() {
		return dateValue;
	}
	function setDate(date: CalendarDate) {
		dateValue = date;
		value = dateValue?.toDate(getLocalTimeZone());
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger id="{id}-date">
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="w-full justify-between font-normal">
				{dateValue
					? dateValue.toDate(getLocalTimeZone()).toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})
					: t`Select date`}
				<ChevronDownIcon />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto overflow-hidden p-0" align="start">
		<Calendar
			type="single"
			bind:value={getDate as () => CalendarDate, setDate}
			captionLayout="dropdown"
			onValueChange={() => {
				open = false;
			}}
			maxValue={today(getLocalTimeZone())}
		/>
	</Popover.Content>
</Popover.Root>
