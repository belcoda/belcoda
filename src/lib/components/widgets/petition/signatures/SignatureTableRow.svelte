<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { type ReadPetitionSignatureZeroWithPerson } from '$lib/schema/petition/petition-signature';
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';

	let {
		signature,
		petition,
		selectedSignatures = $bindable()
	}: {
		signature: ReadPetitionSignatureZeroWithPerson;
		petition: ReadPetitionZero;
		selectedSignatures: ReadPetitionSignatureZeroWithPerson[];
	} = $props();

	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { formatDate } from '$lib/utils/date';
</script>

<Table.Row>
	<Table.Cell>
		{@render personItem(signature)}
	</Table.Cell>
	<Table.Cell>
		<div class="text-sm text-muted-foreground">
			{formatDate(signature.createdAt * 1000)}
		</div>
	</Table.Cell>
	<Table.Cell class="text-end">
		<!-- TODO: Add signature action button -->
		<!-- <SignatureActionButton {signature} {petition} /> -->
	</Table.Cell>
</Table.Row>

{#snippet personItem(signature: ReadPetitionSignatureZeroWithPerson)}
	<div class="border-b border-b-accent/70 px-2 py-1.5 last:border-b-0">
		<label for={`person-${signature.personId}`} class="flex items-center gap-2">
			<Checkbox
				class="me-2"
				id={`person-${signature.personId}`}
				checked={selectedSignatures.includes(signature)}
				onCheckedChange={() => {
					if (selectedSignatures.includes(signature)) {
						selectedSignatures = selectedSignatures.filter((s) => s.id !== signature.id);
					} else {
						selectedSignatures = [...selectedSignatures, signature];
					}
				}}
			/>
			<div class="flex grow items-center gap-2">
				<Avatar
					src={signature.person.profilePicture}
					class="size-6"
					name1={signature.person.givenName ||
						signature.person.familyName ||
						signature.person.emailAddress ||
						''}
					name2={signature.person.familyName}
				/>
				<div class="flex flex-col">
					<div class="text-sm font-medium">
						{signature.person.givenName}
						{signature.person.familyName}
					</div>
					<div class="line-clamp-1 max-w-full text-xs text-muted-foreground">
						{#if signature.person.emailAddress}
							{signature.person.emailAddress}
						{:else if signature.person.phoneNumber}
							{signature.person.phoneNumber}
						{/if}
					</div>
				</div>
			</div>
		</label>
	</div>
{/snippet}
