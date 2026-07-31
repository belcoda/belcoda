<script lang="ts">
	import StarIcon from '@lucide/svelte/icons/star';
	import { toast } from 'svelte-sonner';
	import { v7 as uuidv7 } from 'uuid';

	import { Button } from '$lib/components/ui/button/index.js';
	import { t } from '$lib/index.svelte';
	import type { FavouriteReferenceType } from '$lib/schema/favourite';
	import { appState } from '$lib/state.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';

	let {
		referenceType,
		referenceId
	}: {
		referenceType: FavouriteReferenceType;
		referenceId: string;
	} = $props();

	const favourite = $derived.by(() =>
		z.createQuery(
			queries.favourite.read({
				organizationId: appState.organizationId,
				referenceType,
				referenceId
			})
		)
	);
	const isFavourite = $derived(Boolean(favourite.data));
	const queryReady = $derived(favourite.details.type === 'complete');
	const queryFailed = $derived(favourite.details.type === 'error');
	const canToggle = $derived(queryReady || queryFailed);
	const label = $derived(
		isFavourite
			? t`Remove from favourites and stop receiving related notifications`
			: t`Add to favourites and receive related notifications`
	);
	let saving = $state(false);

	async function toggleFavourite() {
		if (!canToggle || saving) return;

		const existingFavourite = favourite.data;
		saving = true;
		try {
			const result = existingFavourite
				? z.mutate(
						mutators.favourite.remove({
							metadata: {
								favouriteId: existingFavourite.id,
								organizationId: appState.organizationId,
								memberId: appState.memberId,
								referenceType,
								referenceId
							}
						})
					)
				: z.mutate(
						mutators.favourite.add({
							metadata: {
								favouriteId: uuidv7(),
								organizationId: appState.organizationId,
								memberId: appState.memberId,
								referenceType,
								referenceId
							}
						})
					);
			await result.client;
			const serverResult = await result.server;
			if (serverResult.type === 'error') {
				throw new Error(serverResult.error.message);
			}
			toast.success(existingFavourite ? t`Removed from favourites` : t`Added to favourites`);
		} catch {
			toast.error(t`Could not update favourites. Please try again.`);
		} finally {
			saving = false;
		}
	}
</script>

<Button
	variant="outline"
	size="icon"
	class={isFavourite ? 'text-amber-500' : undefined}
	disabled={!canToggle || saving}
	aria-label={label}
	aria-pressed={isFavourite}
	title={label}
	onclick={toggleFavourite}
	data-testid={`favourite-${referenceType}-button`}
>
	<StarIcon class="size-5" fill={isFavourite ? 'currentColor' : 'none'} />
</Button>
