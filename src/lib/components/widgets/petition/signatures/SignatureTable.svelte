<script lang="ts">
	import { type ReadPetitionSignatureZeroWithPerson } from '$lib/schema/petition/petition-signature';
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	import { t } from '$lib/index.svelte';

	let {
		signatures,
		petition,
		selectedSignatures = $bindable([]),
		queryIsCompleted
	}: {
		signatures: ReadPetitionSignatureZeroWithPerson[];
		petition: ReadPetitionZero;
		selectedSignatures: ReadPetitionSignatureZeroWithPerson[];
		queryIsCompleted: boolean;
	} = $props();

	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	import SignatureTableRow from './SignatureTableRow.svelte';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';

	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import { handleAddPerson } from './signatureActions';
	
	const signatureCountLabel = (count: number) => {
		return t`${count.toString()} signatures`;
	};
</script>

{#if queryIsCompleted && signatures.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Content>
				<div class="flex gap-2">
					<AddPersonModal
						trigger={emptyAddPersonTrigger}
						personIdsToExclude={[]}
						onSelected={(personIds) => {
							handleAddPerson({ petitionId: petition.id, personIds });
						}}
					/>
					{#snippet emptyAddPersonTrigger()}<Button>{t`Add Person`}</Button>{/snippet}
				</div>
			</Empty.Content>
			<Empty.Media variant="icon">
				<PenLineIcon />
			</Empty.Media>
			<Empty.Title>{t`No signatures found`}</Empty.Title>
			<Empty.Description
				>{t`No signatures found for this petition. Signatures will appear here once people sign.`}</Empty.Description
			>
		</Empty.Header>
	</Empty.Root>
{:else}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={selectedSignatures.length === signatures.length}
							onCheckedChange={(checked) => {
								if (checked) {
									selectedSignatures = signatures;
								} else {
									selectedSignatures = [];
								}
							}}
						/>
						{#if selectedSignatures.length > 0}
							{t`Signatures`} ({signatureCountLabel(
								selectedSignatures.length
							)}/{signatureCountLabel(signatures.length)})
						{:else}
							{t`Signatures`} ({signatureCountLabel(signatures.length)})
						{/if}
					</div>
				</Table.Head>
				<Table.Head>{t`Signed At`}</Table.Head>
				<Table.Head class="text-end">{t`Actions`}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each signatures as signature}
				<SignatureTableRow {signature} {petition} bind:selectedSignatures />
			{/each}
			{#if !queryIsCompleted}
				{@render personSkeleton()}
				{@render personSkeleton()}
				{@render personSkeleton()}
			{/if}
		</Table.Body>
	</Table.Root>
{/if}

{#snippet personSkeleton()}
	<Table.Row>
		<Table.Cell class="flex items-center gap-2">
			<Skeleton class="size-12 rounded-full" />
			<div class="space-y-2">
				<Skeleton class="h-4 w-[250px]" />
				<Skeleton class="h-4 w-[200px]" />
			</div>
		</Table.Cell>
		<Table.Cell>
			<Skeleton class="h-4 w-[200px]" />
		</Table.Cell>
		<Table.Cell class="text-end">
			<div class="flex justify-end"><Skeleton class="h-4 w-[100px]" /></div>
		</Table.Cell>
	</Table.Row>
{/snippet}
