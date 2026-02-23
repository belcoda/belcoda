<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import * as dateUtils from '$lib/utils/date';
	import Tag from '@lucide/svelte/icons/tag';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();

	const tag = $derived.by(() => {
		return z.createQuery(queries.tag.read({ tagId: activity.referenceId }));
	});
</script>

{#if tag.data}
	<div class="w-full px-4 py-2 text-center text-sm text-gray-400">
		<div class="text-xs">{dateUtils.formatShortTimestamp(new Date(activity.createdAt).getTime())}</div>
		<div class="flex items-center justify-center gap-1">
			Removed from
			<a class="flex items-center gap-1" href={`/settings/tags/${tag.data.id}`}>
				<Tag class="size-3" />
				<div class="font-medium underline hover:text-gray-500">{tag.data.name}</div>
			</a>
		</div>
	</div>
{/if}
