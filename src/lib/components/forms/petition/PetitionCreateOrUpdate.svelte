<script lang="ts">
	import { t } from '$lib/index.svelte';
	import SvelteLexical from '$lib/components/ui/wysiwyg/SvelteLexical.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
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
	if ($data.settings.tags === undefined) {
		$data.settings.tags = [];
	}
	if ($data.published === undefined) {
		$data.published = false;
	}
	if ($data.petitionText === undefined) {
		$data.petitionText = null;
	}

	let dangerOpen = $state(false);
	let confirmArchiveOpen = $state(false);
	let confirmDeleteOpen = $state(false);

	import * as Form from '$lib/components/ui/form/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { defaultPetitionSettings } from '$lib/schema/petition/settings';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import PetitionSignupSurvey from '$lib/components/forms/petition/PetitionSignupSurvey.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { TagSelectMulti } from '$lib/components/ui/custom-select/tag/index.js';

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
			{@render petitionTextInput()}
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

	<Card.Root>
		<Card.Header>
			<Card.Title>{t`Petition page`}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			<SvelteLexical bind:value={$data.description} />
		</Card.Content>
	</Card.Root>

	{#if $data.settings && $data.settings.survey}
		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Survey`}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<PetitionSignupSurvey bind:form bind:data bind:errors />
			</Card.Content>
		</Card.Root>
	{/if}

	{#if $data.settings}
		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Automatic tags`}</Card.Title>
				<Card.Description>
					{t`Optional tags applied to people when they sign this petition.`}
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<TagSelectMulti bind:selectedIds={$data.settings.tags} />
			</Card.Content>
		</Card.Root>
	{/if}

	{#if petition}
		<Collapsible.Root bind:open={dangerOpen} class="rounded-lg border border-destructive/40">
			<Collapsible.Trigger
				class="flex w-full items-center justify-between gap-2 p-4 text-left font-medium text-destructive"
			>
				<span>{t`Danger zone`}</span>
				<ChevronDownIcon class="size-4 transition-transform {dangerOpen ? 'rotate-180' : ''}" />
			</Collapsible.Trigger>
			<Collapsible.Content class="px-4 pb-4">
				{#if petition.published}
					<p class="mb-3 text-sm text-muted-foreground">
						{t`Archive this petition. You can still view it in the archived petitions list.`}
					</p>
					<Button type="button" variant="destructive" onclick={() => (confirmArchiveOpen = true)}
						>{t`Archive petition`}</Button
					>
					<ConfirmDialog
						bind:open={confirmArchiveOpen}
						title={t`Archive this petition?`}
						description={t`This petition will be archived. You can still view it in the archived petitions list.`}
						confirmText={t`Archive`}
						confirmVariant="destructive"
						onConfirm={() => {
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
						}}
					/>
				{:else}
					<p class="mb-3 text-sm text-muted-foreground">
						{t`Permanently delete this draft petition. This action cannot be undone.`}
					</p>
					<Button type="button" variant="destructive" onclick={() => (confirmDeleteOpen = true)}
						>{t`Delete petition`}</Button
					>
					<ConfirmDialog
						bind:open={confirmDeleteOpen}
						title={t`Delete this petition?`}
						description={t`This draft petition will be permanently deleted. This action cannot be undone.`}
						confirmText={t`Delete`}
						confirmVariant="destructive"
						onConfirm={() => {
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
						}}
					/>
				{/if}
			</Collapsible.Content>
		</Collapsible.Root>
	{/if}

	<Debug {data} />
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
				<Form.Label>{t`Short description`}</Form.Label>
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

{#snippet petitionTextInput()}
	<Form.Field {form} name="petitionText" class="w-full">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`Petition text`}</Form.Label>
				<InputGroup.Root>
					<InputGroup.Textarea
						bind:value={$data.petitionText}
						{...props}
						placeholder={t`Full text of the petition`}
						class="min-h-[120px]"
					/>
				</InputGroup.Root>
				<Form.Description>
					{t`The full statement shown on the petition page (optional).`}
				</Form.Description>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}
