<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { beforeNavigate } from '$app/navigation';
	import { useDebounce } from 'runed';
	import { slugify } from '$lib/utils/slug';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { env } from '$env/dynamic/public';
	const { PUBLIC_ROOT_DOMAIN } = env;
	import { dev } from '$app/environment';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { appState } from '$lib/state.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import LinkIcon from '@lucide/svelte/icons/link';
	import createForm from '$lib/form.svelte';
	import {
		type ReadPetitionZero,
		createPetitionZero,
		updatePetitionZero,
		type CreatePetitionZero,
		type UpdatePetitionZero
	} from '$lib/schema/petition/petition';

	const {
		petition,
		onSubmit
	}: {
		petition?: ReadPetitionZero;
		onSubmit: (data: CreatePetitionZero | UpdatePetitionZero) => void | Promise<void>;
	} = $props();

	import { generatePetitionTitleAsyncSchema } from '$lib/schema/petition/helpers';
	/* svelte-ignore state_referenced_locally */
	const { title, slug } = generatePetitionTitleAsyncSchema(appState.organizationId, petition?.id);
	import { objectAsync } from 'valibot';

	let { form, data, errors, Errors, Debug, helpers } = $state(
		/* svelte-ignore state_referenced_locally */
		petition
			? createForm({
					schema: objectAsync({
						...updatePetitionZero.entries,
						title: title,
						slug: slug
					}),
					/* svelte-ignore state_referenced_locally */
					initialData: petition,
					onSubmit: async (data) => {
						await onSubmit(data);
						form.tainted.set(undefined);
					}
				})
			: createForm({
					schema: objectAsync({
						...createPetitionZero.entries,
						title: title,
						slug: slug
					}),
					validateOnLoad: false,
					onSubmit: async (data) => {
						await onSubmit(data);
						form.tainted.set(undefined);
					}
				})
	);

	// Set defaults if required
	if (!$data.settings) {
		$data.settings = defaultPetitionSettings();
	}
	if ($data.settings.survey === undefined) {
		$data.settings.survey = defaultPetitionSettings().survey;
	}
	if ($data.published === undefined) {
		$data.published = false;
	}

	import * as Form from '$lib/components/ui/form/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { defaultPetitionSettings } from '$lib/schema/petition/settings';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';

	$effect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (!helpers.isTainted()) return;
			e.preventDefault();
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	beforeNavigate((nav) => {
		if (!helpers.isTainted()) return;
		if (!nav.to) return;
		if (!confirm(t`Your changes might not be saved. Leave this page?`)) {
			nav.cancel();
		}
	});

	let editSlugOpen = $state(false);
</script>

<form use:form.enhance class="mx-auto flex w-full max-w-4xl flex-col gap-4" id="petition-form">
	<Errors {errors} />

	<Card.Root>
		<Card.Header>
			<Card.Title>{t`Basic information`}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			{@render titleInput()}
			{@render descriptionInput()}
			{@render targetInput()}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>{t`Feature image`}</Card.Title>
			<Card.Description
				>{t`This image will be displayed on the petition page and in shared links.`}</Card.Description
			>
		</Card.Header>
		<Card.Content class="space-y-6">
			<CroppedImageUpload
				class="aspect-video w-full"
				onUpload={async (bucketUrl) => {
					$data.featureImage = bucketUrl;
				}}
			/>
		</Card.Content>
	</Card.Root>

	{#if petition}
		<Alert.Root variant="destructive" class="mt-4">
			<AlertCircleIcon />
			<Alert.Title>{t`Danger zone!`}</Alert.Title>
			<Alert.Description>
				{#if petition.published}
					{t`This petition will be archived. You can still view it in the archived petitions list.`}
					<div class="mt-2">
						<Button
							type="button"
							variant="destructive"
							onclick={async () => {
								if (
									window.confirm(
										t`This petition will be archived. You can still view it in the archived petitions list.`
									)
								) {
									z.mutate(
										mutators.petition.archive({
											metadata: {
												petitionId: petition.id,
												organizationId: appState.organizationId
											}
										})
									);
									toast.success(t`Petition archived`);
									goto('/petitions');
								}
							}}>{t`Archive petition`}</Button
						>
					</div>
				{:else}
					{t`This draft petition will be permanently deleted. This action cannot be undone.`}
					<div class="mt-2">
						<Button
							type="button"
							variant="destructive"
							onclick={async () => {
								if (
									window.confirm(
										t`This draft petition will be permanently deleted. This action cannot be undone.`
									)
								) {
									z.mutate(
										mutators.petition.delete({
											metadata: {
												petitionId: petition.id,
												organizationId: appState.organizationId
											}
										})
									);
									toast.success(t`Petition deleted`);
									goto('/petitions');
								}
							}}>{t`Delete petition`}</Button
						>
					</div>
				{/if}
			</Alert.Description>
		</Alert.Root>
	{/if}

	<Debug {data} hide={true} />
</form>

{#snippet titleInput()}
	<Form.Field {form} name="title" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`Title`}</Form.Label>
				<InputGroup.Root>
					<InputGroup.Input
						bind:value={$data.title}
						{...props}
						placeholder={t`Title`}
						oninput={useDebounce(
							() => {
								if (!form.isTainted('slug')) {
									data.update(
										//@ts-expect-error - the $store may contain some uninitialized fields
										($store) => {
											const slug = slugify($data.title ?? '');
											return { ...$store, slug };
										},
										{ taint: false }
									);
								}
							},
							() => 300
						)}
					/>
					{#if $data.title && $data.title.length > 0}
						<InputGroup.Addon align="block-end" class="flex items-center justify-end gap-2">
							<InputGroup.Text>
								<LinkIcon class="size-4" /><span class="font-mono text-xs"
									>http{dev ? '' : 's'}://{appState.activeOrganization.data
										?.slug}.{PUBLIC_ROOT_DOMAIN}/petitions/{$data.slug}</span
								>
								<ResponsiveModal title={t`Edit petition link`} bind:open={editSlugOpen}>
									{#snippet trigger()}
										<InputGroup.Button type="button">Edit</InputGroup.Button>
									{/snippet}

									<Form.Field {form} name="slug">
										<Form.Control>
											{#snippet children({ props })}
												<Input
													bind:value={$data.slug}
													{...props}
													class="font-mono"
													placeholder={t`Slug`}
												/>
											{/snippet}
										</Form.Control>
										<Form.Description>
											{t`This is a URL-friendly identifier for the petition and is part of the petition
											link. It must be unique and can only contain lowercase letters, numbers, and
											hyphens.`}
										</Form.Description>
										<Form.FieldErrors />
									</Form.Field>
									{#snippet footer()}
										<Button
											variant="default"
											size="sm"
											class="w-full"
											type="button"
											onclick={() => {
												form.validate('slug');
												editSlugOpen = false;
											}}>{t`Save`}</Button
										>
									{/snippet}
								</ResponsiveModal>
							</InputGroup.Text>
						</InputGroup.Addon>
					{/if}
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet descriptionInput()}
	<Form.Field {form} name="shortDescription" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`Description`}</Form.Label>
				<InputGroup.Root>
					<InputGroup.Textarea
						bind:value={$data.shortDescription}
						{...props}
						placeholder={t`Description`}
						class="min-h-[80px]"
					/>
					{#if $data.shortDescription && $data.shortDescription.length > 0}
						<InputGroup.Addon align="block-end" class="justify-end">
							<InputGroup.Text>{$data.shortDescription.length} / 1000</InputGroup.Text>
						</InputGroup.Addon>
					{/if}
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet targetInput()}
	<Form.Field {form} name="petitionTarget" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`Petition target`}</Form.Label>
				<InputGroup.Root>
					<InputGroup.Input
						bind:value={$data.petitionTarget}
						{...props}
						placeholder={t`e.g., Local Government, CEO of Company X`}
					/>
				</InputGroup.Root>
				<Form.Description>
					{t`Who is this petition directed to? (e.g., "The Mayor of Springfield", "Parliament")`}
				</Form.Description>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}
