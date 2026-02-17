<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { parse } from 'valibot';
	import { t } from '$lib/index.svelte';
	import {
		createPerson,
		type CreateMutatorSchemaZeroInput,
		createMutatorSchemaZero
	} from '$lib/schema/person';
	import { Input } from '$lib/components/ui/input/index.js';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { v7 as uuidv7 } from 'uuid';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { defaultCountryCode } from '$lib/utils/country';
	import queries from '$lib/zero/query/index';
	import { Button } from '$lib/components/ui/button/index.js';
	import { type ReadPersonZero } from '$lib/schema/person';
	const personId = uuidv7();
	type Props = {
		modalMode: 'list' | 'create';
		onCreated: (personId: string) => Promise<void>;
	};
	let { modalMode = $bindable(), onCreated }: Props = $props();
	const { form, data, errors, Errors, helpers } = createForm({
		schema: createPerson,
		initialData: {
			country: appState.activeOrganization.data?.country || defaultCountryCode,
			preferredLanguage: appState.activeOrganization.data?.defaultLanguage || 'en'
		},
		onSubmit: async (data) => {
			const toCreate: CreateMutatorSchemaZeroInput = {
				input: {
					givenName: data.givenName,
					familyName: data.familyName,
					emailAddress: data.emailAddress,
					phoneNumber: data.phoneNumber,
					country: data.country,
					preferredLanguage: data.preferredLanguage
				},
				metadata: {
					organizationId: appState.organizationId,
					personId: personId,
					addedFrom: {
						type: 'added_manually',
						userId: appState.userId
					}
				}
			};
			const parsed = parse(createMutatorSchemaZero, toCreate);
			const input = z.mutate(mutators.person.create(parsed));
			onCreated(personId);
		}
	});
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
</script>

<ScrollArea class="h-[calc(100vh-400px)]">
	<form use:form.enhance class="flex flex-col gap-4 px-6">
		<div class="col-span-2 mt-3 mb-8 flex w-full justify-center">
			<CroppedImageUpload
				aspectRatio={1 / 1}
				class="aspect-square h-40 w-40 rounded-full object-cover"
				onUpload={async (url) => {
					$data.profilePicture = url;
				}}
			/>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<Form.Field {form} name="givenName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Given name</Form.Label>
						<Input {...props} bind:value={$data.givenName} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="familyName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Family name</Form.Label>
						<Input {...props} bind:value={$data.familyName} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
		<Form.Field {form} name="emailAddress">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Email address</Form.Label>
					<Input {...props} bind:value={$data.emailAddress} placeholder="email@example.com" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="phoneNumber">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Phone Number</Form.Label>
					<Input {...props} bind:value={$data.phoneNumber} placeholder="123-456-7890" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</form>
</ScrollArea>
<div class="flex items-center justify-end gap-2">
	<Button variant="outline" onclick={() => (modalMode = 'list')}>{t`Back`}</Button>
	<Button
		onclick={() => {
			form.submit();
		}}
		>{t`Create person`}
	</Button>
</div>
