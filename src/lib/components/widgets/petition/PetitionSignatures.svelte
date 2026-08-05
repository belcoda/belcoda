<script lang="ts">
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	import { locale, t } from '$lib/index.svelte';
	const { petition }: { petition: Readonly<ReadPetitionZero> } = $props();
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import type { PetitionSignatureListFilter } from '$lib/zero/query/petition_signature/list';
	import queries from '$lib/zero/query/index';
	import { type ReadPetitionSignatureZeroWithPerson } from '$lib/schema/petition/petition-signature';
	import { PaginatedZeroList } from '$lib/state/paginated-zero-list.svelte';
	import { encodePetitionSignatureListCursor } from '$lib/utils/petition-signature/cursor';
	import { IsInViewport, watch } from 'runed';
	import { formatNumber } from '$lib/utils/number';

	const pageSize = 25;
	let sentinel: HTMLElement | null = $state(null);
	const sentinelIsInViewport = $derived(new IsInViewport(() => sentinel));

	let filter: PetitionSignatureListFilter & { favouriteMode: 'all' | 'only' } = $state({
		...getListFilter(appState.organizationId),
		favouriteMode: 'all',
		/* svelte-ignore state_referenced_locally */
		petitionId: petition.id
	});

	const paginatedSignatures = new PaginatedZeroList<
		PetitionSignatureListFilter,
		ReadPetitionSignatureZeroWithPerson
	>({
		getBaseFilter: () => filter,
		encodeCursor: encodeSignatureCursor,
		pageSize
	});
	import { onDestroy } from 'svelte';
	import {
		registerPetitionSignaturesListPaginationReset,
		resetPetitionSignaturesListPagination,
		unregisterPetitionSignaturesListPaginationReset
	} from './signatures/petition-signatures-list-pagination';

	registerPetitionSignaturesListPaginationReset(() => paginatedSignatures.reset());
	onDestroy(unregisterPetitionSignaturesListPaginationReset);

	const petitionSignatures = $derived.by(() => {
		return z.createQuery(queries.petitionSignature.list(paginatedSignatures.pageFilter));
	});

	watch(
		() => petitionSignatures.data,
		(data) => {
			paginatedSignatures.handlePage(data);
		}
	);

	watch(
		() =>
			[
				sentinelIsInViewport.current,
				paginatedSignatures.hasMore,
				paginatedSignatures.items.length
			] as const,
		([isInViewport, hasMore]) => {
			if (isInViewport && hasMore) {
				paginatedSignatures.loadMore();
			}
		}
	);

	function encodeSignatureCursor(signature: ReadPetitionSignatureZeroWithPerson) {
		return encodePetitionSignatureListCursor({
			createdAt: signature.createdAt,
			id: signature.id
		});
	}

	let selectedSignatures = $state<Readonly<ReadPetitionSignatureZeroWithPerson>[]>([]);

	import * as Card from '$lib/components/ui/card/index.js';
	import PersonFilter from '$lib/components/widgets/person/filter/Filter.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import SignatureTable from './signatures/SignatureTable.svelte';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';
	import { handleAddPerson } from './signatures/signatureActions';
</script>

<Card.Root data-testid="petition-signature-table">
	<Card.Header>
		<Card.Title class="flex items-start justify-between gap-2 font-normal">
			<div class="grow space-y-3">
				<PersonFilter bind:filter hideActivityFilter={true} />
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					href="/petitions/{petition.id}/signatures"
					data-testid="petition-signatures-view-all"
				>
					{t`View all`}
				</Button>
				{#if !petition.archivedAt}
					<AddPersonModal
						trigger={addPersonTrigger}
						personIdsToExclude={paginatedSignatures.items.map((sig) => sig.personId)}
						actionText={t`Add signature`}
						onSelected={(personIds) => {
							handleAddPerson({ petitionId: petition.id, personIds });
							resetPetitionSignaturesListPagination();
						}}
					/>
				{/if}
			</div>
		</Card.Title>
	</Card.Header>

	<Card.Content>
		<div data-testid="petition-signatures-list">
			<SignatureTable
				signatures={paginatedSignatures.items}
				{petition}
				bind:selectedSignatures
				queryIsCompleted={petitionSignatures.details.type === 'complete'}
			/>
			{#if paginatedSignatures.hasMore}
				<div
					bind:this={sentinel}
					class="h-1"
					data-testid="petition-signatures-scroll-sentinel"
				></div>
			{/if}
			{#if paginatedSignatures.items.length > 0}
				<div class="pt-2 text-center text-xs text-muted-foreground">
					{t`${formatNumber(paginatedSignatures.items.length, locale.current)} shown`}
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

{#snippet addPersonTrigger()}<Button><UserPlusIcon strokeWidth={2.5} /> {t`Add signature`}</Button
	>{/snippet}
