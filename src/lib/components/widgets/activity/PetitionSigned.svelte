<script lang="ts">
	import type { ReadActivityZero } from '$lib/schema/activity';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import * as dateUtils from '$lib/utils/date';
	import FileSignature from '@lucide/svelte/icons/file-signature';

	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();

	const petitionSignature = $derived.by(() => {
		return z.createQuery(
			queries.petitionSignature.read({ petitionSignatureId: activity.referenceId })
		);
	});

	const petition = $derived.by(() => {
		if (!petitionSignature.data) return null;
		return z.createQuery(queries.petition.read({ petitionId: petitionSignature.data.petitionId }));
	});
</script>

{#if petitionSignature.data && petition?.data}
	<div class="w-full px-4 py-2 text-center text-sm text-gray-400">
		<div class="text-xs">{dateUtils.formatShortTimestamp(activity.createdAt)}</div>
		<div class="flex items-center justify-center gap-1">
			Signed petition
			<a class="flex items-center gap-1" href={`/petitions/${petition.data.id}`}>
				<FileSignature class="size-3" />
				<div class="font-medium underline hover:text-gray-500">{petition.data.title}</div>
			</a>
		</div>
	</div>
{/if}
