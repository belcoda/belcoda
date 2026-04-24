<script lang="ts">
	import { Time, getLocalTimeZone } from '@internationalized/date';
	import { Label } from '$lib/components/ui/label';
	import TimePickerInput from './time-picker-input.svelte';
	import { cn } from '$lib/utils';
	import TimePeriodSelect from './time-period-select.svelte';
	import {
		type Period,
		convertTimestampToTime,
		getPeriodFromTime,
		updateTimestampTime
	} from './time-picker-utils';

	let {
		timestamp = $bindable(),
		timezone = getLocalTimeZone(),
		showSeconds = false,
		view = 'labels',
		setTime,
		setPeriod
	}: {
		timestamp: number;
		showSeconds?: boolean;
		timezone?: string | undefined;
		view?: 'labels' | 'dotted';

		setTime?: (time: Time) => void;
		setPeriod?: (period: Period) => void;
	} = $props();

	function derivePeriod(timestamp: number) {
		console.log(timestamp, 'timestamp');
		console.log(timezone, 'timezone');
		console.log(new Date(timestamp).toISOString(), 'date');
		const time = convertTimestampToTime(timestamp, timezone);
		console.log(time, 'time');
		return getPeriodFromTime(time);
	}

	let period = $state<Period>(derivePeriod(timestamp));
	let minuteRef = $state<HTMLInputElement | null>(null);
	let hourRef = $state<HTMLInputElement | null>(null);
	let secondRef = $state<HTMLInputElement | null>(null);
	let periodRef = $state<HTMLInputElement | null>(null);

	function getTime() {
		return convertTimestampToTime(timestamp, timezone);
	}
	function setNewTime(time: Time) {
		const newTimestamp = updateTimestampTime({ timestamp, timezone, newTime: time });
		timestamp = newTimestamp;
	}

	function getPeriod() {
		console.log(period, 'getPeriod');
		return period;
	}
	function setNewPeriod(newPeriod: Period) {
		console.log(period, newPeriod, 'setPeriod');
		period = newPeriod;
	}
</script>

<div class={cn('flex items-center gap-2', view === 'dotted' && 'gap-1')}>
	<div class="grid gap-1 text-center">
		{#if view === 'labels'}
			<Label for="hours" class="text-xs">Hours</Label>
		{/if}

		<TimePickerInput
			picker="12hours"
			bind:time={getTime, setNewTime}
			bind:ref={hourRef}
			{setTime}
			{period}
			onRightFocus={() => minuteRef?.focus()}
		/>
	</div>

	{#if view === 'dotted'}
		<span class="-translate-y-[2px]">:</span>
	{/if}

	<div class="grid gap-1 text-center">
		{#if view === 'labels'}
			<Label for="minutes" class="text-xs">Minutes</Label>
		{/if}

		<TimePickerInput
			picker="minutes"
			bind:time={getTime, setNewTime}
			bind:ref={minuteRef}
			{setTime}
			onLeftFocus={() => hourRef?.focus()}
			onRightFocus={() => secondRef?.focus()}
		/>
	</div>

	{#if showSeconds}
		{#if view === 'dotted'}
			<span class="-translate-y-[2px]">:</span>
		{/if}

		<div class="grid gap-1 text-center">
			{#if view === 'labels'}
				<Label for="seconds" class="text-xs">Seconds</Label>
			{/if}

			<TimePickerInput
				picker="seconds"
				bind:time={getTime, setNewTime}
				bind:ref={secondRef}
				{setTime}
				onLeftFocus={() => minuteRef?.focus()}
				onRightFocus={() => periodRef?.focus()}
			/>
		</div>
	{/if}

	<div class="grid gap-1 text-center">
		{#if view === 'labels'}
			<Label for="period" class="text-xs">Period</Label>
		{/if}

		<TimePeriodSelect
			bind:period={getPeriod, setNewPeriod}
			bind:time={getTime, setNewTime}
			{setPeriod}
			{setTime}
			ref={periodRef}
			onLeftFocus={() => secondRef?.focus()}
		/>
	</div>
</div>
