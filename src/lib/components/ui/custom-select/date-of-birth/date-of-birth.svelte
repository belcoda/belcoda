<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, today, type CalendarDate, parseDate } from '@internationalized/date';
	import { t } from '$lib/index.svelte';

	const id = $props.id();
	let { value = $bindable(null) }: { value: Date | null | undefined } = $props();
	if (!value) {
		value = new Date();
	}
	let open = $state(false);
	let dateValue = $state<CalendarDate>(parseDate(value.toISOString().slice(0, 10)));

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
			bind:value={getDate, setDate}
			captionLayout="dropdown"
			onValueChange={() => {
				open = false;
			}}
			maxValue={today(getLocalTimeZone())}
		/>
	</Popover.Content>
</Popover.Root>
