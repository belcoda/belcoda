<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { type ReadPetitionZero } from '$lib/schema/petition/petition';
	import { type Snippet } from 'svelte';
	import { v7 as uuidv7 } from 'uuid';
	let {
		petition,
		trigger,
		open = $bindable()
	}: { petition: ReadPetitionZero; trigger?: Snippet; open: boolean } = $props();
	import { Button } from '$lib/components/ui/button/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import createForm from '$lib/form.svelte';
	import { generateCreatePetitionZeroAsyncSchema } from '$lib/schema/petition/petition';
	import { z } from '$lib/zero.svelte';
	import { slugify } from '$lib/utils/slug';
	const newPetition = {
		...petition,
		title: `${t`Copy of`} ${petition.title}`,
		slug: `copy-of-${petition.slug}`,
		published: false,
		publishedAt: null,
		createdAt: new Date().getTime(),
		updatedAt: new Date().getTime(),
		deletedAt: null,
		archivedAt: null
	};
	let { form, data, errors, Errors, Debug } = $state(
		createForm({
			schema: generateCreatePetitionZeroAsyncSchema(appState.organizationId ?? ''),
			initialData: newPetition,
			onSubmit: async (data) => {
				const petitionId = uuidv7();
				const writePetition = z.mutate.petition.create({
					metadata: {
						organizationId: appState.organizationId,
						teamId: appState.activeTeamId,
						petitionId: petitionId
					},
					input: {
						...data,
						slug: slugify(data.title)
					}
				});
				await writePetition.client;
				await goto(`/petitions/${petitionId}`);
			}
		})
	);
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { goto } from '$app/navigation';
</script>

<ResponsiveModal {trigger} bind:open>
	<form use:form.enhance class="mx-auto flex w-full max-w-4xl flex-col gap-4" id="petition-form">
		<Form.Field {form} name="title">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{t`Petition title`}</Form.Label>
					<Input {...props} bind:value={$data.title} placeholder={t`Petition title`} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Button type="submit">{t`Make a copy`}</Button>
		<Debug {data} hide={true} />
	</form>
</ResponsiveModal>
