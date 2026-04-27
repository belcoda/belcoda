<script lang="ts" module>
	import type { Time as TimeType } from '@internationalized/date';
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLInputAttributes } from 'svelte/elements';

	export type TimePickerInputProps = WithElementRef<HTMLInputAttributes> & {
		type?: string;
		value?: string;
		name?: string;
		files?: FileList | undefined;
		picker: TimePickerType;
		time: TimeType | undefined;
		setTime?: (time: TimeType) => void;
		period?: Period;
		onRightFocus?: () => void;
		onLeftFocus?: () => void;
	};
</script>

<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import { Time } from '@internationalized/date';
	import {
		type Period,
		type TimePickerType,
		getArrowByType,
		getDateByType,
		setDateByType
	} from './time-picker-utils';

	/** Inactivity before a single committed digit is applied (e.g. "3" → 03). */
	const DIGIT_COMMIT_MS = 550;

	let {
		class: className,
		type = 'tel',
		value,
		files = $bindable(),

		id,
		name,
		time = $bindable(new Time(0, 0)),
		setTime,
		picker,
		period,
		onLeftFocus,
		onRightFocus,

		onkeydown,
		onchange,
		onfocus,
		onblur,

		ref = $bindable(null),

		...restProps
	}: TimePickerInputProps = $props();

	/** Digits in the current entry (max 2). New entry always starts with a key that replaces. */
	let digitBuffer = $state('');

	let commitTimer: ReturnType<typeof setTimeout> | null = null;

	const safeTime = $derived(time ?? new Time(0, 0));
	let calculatedValue = $derived.by(() => getDateByType(safeTime, picker));

	function clearCommitTimer() {
		if (commitTimer !== null) {
			clearTimeout(commitTimer);
			commitTimer = null;
		}
	}

	function resetDigitEntry() {
		clearCommitTimer();
		digitBuffer = '';
	}

	function clamp12h(n: number) {
		return Math.min(Math.max(n, 1), 12);
	}

	function clamp24h(n: number) {
		return Math.min(Math.max(n, 0), 23);
	}

	function clampMinOrSec(n: number) {
		return Math.min(Math.max(n, 0), 59);
	}

	function applyPadded(padded: string) {
		const tempTime = safeTime.copy();
		time = setDateByType(tempTime, padded, picker, period);
		setTime?.(time);
	}

	function commitPadded(padded: string) {
		applyPadded(padded);
		resetDigitEntry();
		onRightFocus?.();
	}

	/**
	 * @param fromTimeout - true when committing a lone first digit after delay (not two keys at once).
	 */
	function tryCommitBuffer(fromTimeout: boolean) {
		const b = digitBuffer;
		if (!b) {
			return;
		}

		if (b.length === 2) {
			const n = Number.parseInt(b, 10);
			if (picker === '12hours') {
				if (n < 1) {
					resetDigitEntry();
					return;
				}
				commitPadded(String(clamp12h(n)).padStart(2, '0'));
			} else if (picker === 'hours') {
				commitPadded(String(clamp24h(n)).padStart(2, '0'));
			} else {
				commitPadded(String(clampMinOrSec(n)).padStart(2, '0'));
			}
			return;
		}

		if (b.length === 1 && fromTimeout) {
			const d = b[0] ?? '';
			const n = Number.parseInt(d, 10);
			// 12h: "0" alone is invalid; user may be going for "01"…"09" (two keys).
			if (picker === '12hours' && d === '0') {
				resetDigitEntry();
				return;
			}
			if (picker === '12hours') {
				commitPadded(String(clamp12h(n)).padStart(2, '0'));
			} else if (picker === 'hours') {
				commitPadded(String(clamp24h(n)).padStart(2, '0'));
			} else {
				commitPadded(String(clampMinOrSec(n)).padStart(2, '0'));
			}
		}
	}

	function scheduleSingleDigitCommit() {
		clearCommitTimer();
		commitTimer = setTimeout(() => {
			commitTimer = null;
			tryCommitBuffer(true);
		}, DIGIT_COMMIT_MS);
	}

	function handleDigitKey(key: string) {
		clearCommitTimer();

		if (digitBuffer.length === 0) {
			digitBuffer = key;
			scheduleSingleDigitCommit();
			return;
		}

		if (digitBuffer.length === 1) {
			digitBuffer = digitBuffer + key;
			tryCommitBuffer(false);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Tab') return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
		const isDigit = e.key >= '0' && e.key <= '9';

		if (isNavKey || isDigit) {
			e.preventDefault();
		}

		if (e.key === 'ArrowRight') {
			resetDigitEntry();
			onRightFocus?.();
		}
		if (e.key === 'ArrowLeft') {
			resetDigitEntry();
			onLeftFocus?.();
		}

		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			resetDigitEntry();
			const step = e.key === 'ArrowUp' ? 1 : -1;
			const newValue = getArrowByType(calculatedValue, step, picker);
			const tempTime = safeTime.copy();
			time = setDateByType(tempTime, newValue, picker, period);
			setTime?.(time);
		}

		if (isDigit) {
			handleDigitKey(e.key);
		}
	}
</script>

<Input
	bind:ref
	id={id || picker}
	name={name || picker}
	class={cn(
		'w-[48px] text-center text-sm tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none',
		className
	)}
	value={value || calculatedValue}
	onchange={(e) => {
		e.preventDefault();
		onchange?.(e);
	}}
	onfocus={(e) => {
		onfocus?.(e);
		resetDigitEntry();
	}}
	onblur={(e) => {
		clearCommitTimer();
		tryCommitBuffer(true);
		if (picker === '12hours' && digitBuffer === '0') {
			resetDigitEntry();
		}
		onblur?.(e);
	}}
	{type}
	inputmode="decimal"
	onkeydown={(e) => {
		onkeydown?.(e);
		handleKeyDown(e);
	}}
	{...restProps}
/>
