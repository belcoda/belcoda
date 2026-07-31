<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';
	import * as dateUtils from '$lib/utils/date';
	import { t } from '$lib/index.svelte';
	import StickyNote from '@lucide/svelte/icons/sticky-note';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();
</script>

<div class="w-full px-4 py-2 text-center text-sm text-gray-400">
	<div class="text-xs">
		{dateUtils.formatShortTimestamp(new Date(activity.createdAt).getTime())}
	</div>
	<div class="flex items-center justify-center gap-1">
		<StickyNote class="size-3" />
		{t`Note added`}
	</div>
</div>
