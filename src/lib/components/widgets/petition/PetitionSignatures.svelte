<script lang="ts">
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	import { t } from '$lib/index.svelte';
	const { petition }: { petition: Readonly<ReadPetitionZero> } = $props();
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import type { PetitionSignatureListFilter } from '$lib/zero/query/petition_signature/list';
	import queries from '$lib/zero/query/index';
	import { type ReadPetitionSignatureZeroWithPerson } from '$lib/schema/petition/petition-signature';

	let filter: PetitionSignatureListFilter = $state({
		...getListFilter(appState.organizationId),
		/* svelte-ignore state_referenced_locally */
		petitionId: petition.id
	});

	const petitionSignatures = $derived.by(() => {
		return z.createQuery(queries.petitionSignature.list(filter));
	});

	let selectedSignatures = $state<Readonly<ReadPetitionSignatureZeroWithPerson>[]>([]);

	import * as Card from '$lib/components/ui/card/index.js';
	import PersonFilter from '$lib/components/widgets/person/filter/Filter.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import SignatureTable from './signatures/SignatureTable.svelte';
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-start justify-between gap-2 font-normal">
			<div class="grow space-y-3">
				<PersonFilter bind:filter hideActivityFilter={true} />
			</div>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" href="/petitions/{petition.id}/signatures">
					{t`View all`}
				</Button>
			</div>
		</Card.Title>
	</Card.Header>

	<Card.Content>
		<SignatureTable
			signatures={petitionSignatures.data ?? []}
			petition={petition}
			bind:selectedSignatures
			queryIsCompleted={petitionSignatures.details.type === 'complete'}
		/>
	</Card.Content>
</Card.Root>

{#snippet addPersonTrigger()}<Button><UserPlusIcon strokeWidth={2.5} /> {t`Add signature`}</Button
	>{/snippet}
