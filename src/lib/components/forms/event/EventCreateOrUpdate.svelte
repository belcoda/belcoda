<script lang="ts">
	import { t } from '$lib/index.svelte';
	import SvelteLexical from '$lib/components/ui/wysiwyg/SvelteLexical.svelte';

	import { useDebounce } from 'runed';
	import { slugify } from '$lib/utils/slug';
	import { getMeetingPlatform, getMeetingPlatformLogoUrl } from '$lib/utils/events/meeting_link';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { getLocalTimeZone, parseAbsolute } from '@internationalized/date';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { env } from '$env/dynamic/public';
	const { PUBLIC_ROOT_DOMAIN } = env;
	import { dev } from '$app/environment';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { appState } from '$lib/state.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import VideoIcon from '@lucide/svelte/icons/video';
	import LinkIcon from '@lucide/svelte/icons/link';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import createForm from '$lib/form.svelte';
	import {
		type ReadEventZero,
		createEventZero,
		updateEventZero,
		type CreateEventZero,
		type UpdateEventZero
	} from '$lib/schema/event';
	const {
		event,
		onSubmit
	}: {
		event?: ReadEventZero;
		onSubmit: (data: CreateEventZero | UpdateEventZero) => void | Promise<void>;
	} = $props();
	import { generateEventTitleAsyncSchema } from '$lib/schema/event/helpers';
	const { title, slug } = generateEventTitleAsyncSchema(appState.organizationId, event?.id);
	import { objectAsync } from 'valibot';
	let { form, data, errors, Errors, Debug, helpers } = $state(
		event
			? createForm({
					schema: objectAsync({
						...updateEventZero.entries,
						title: title,
						slug: slug
					}),
					initialData: event,
					onSubmit: async (data) => {
						console.log(data);
						onSubmit(data);
					}
				})
			: createForm({
					schema: objectAsync({
						...createEventZero.entries,
						title: title,
						slug: slug
					}),
					validateOnLoad: false,
					onSubmit: async (data) => {
						console.log(data);
						onSubmit(data);
					}
				})
	);
	// set defaults if required
	if (!$data.timezone) $data.timezone = getLocalTimeZone();
	if (!$data.settings) $data.settings = defaultEventSettings();
	if ($data.settings.survey === undefined) {
		$data.settings.survey = defaultEventSettings().survey;
	}
	import * as Form from '$lib/components/ui/form/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';

	import DateTimeSelect from '$lib/components/forms/event/DateTimeSelect.svelte';
	import EventSignupSurvey from '$lib/components/forms/event/EventSignupSurvey.svelte';
	import { defaultEventSettings } from '$lib/schema/event/settings';

	function setSlug(slug: string) {
		$data.slug = slugify(slug);
	}
	function getSlug() {
		return $data.slug;
	}
	let editSlugOpen = $state(false);
</script>

<form use:form.enhance class="mx-auto flex w-full max-w-4xl flex-col gap-4" id="event-form">
	<Errors {errors} />
	<Card.Root>
		<Card.Header>
			<Card.Title>{t`Basic information`}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			{@render titleInput()}
			{@render descriptionInput()}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>{t`Date and time`}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			<!-- {@render dateTimeSelect()} -->
			<DateTimeSelect bind:form bind:data bind:errors />
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>{t`Location`}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			{@render locationTabs()}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>{t`Feature image`}</Card.Title>
			<Card.Description
				>{t`This event will be displayed on the event page and in notifications and shared links.`}</Card.Description
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
			<Card.Title>{t`Event page`}</Card.Title>
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
				<EventSignupSurvey bind:form bind:data bind:errors />
			</Card.Content>
		</Card.Root>
	{/if}
	<Debug {data} hide={false} />
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
										//@ts-expect-error - the $store may contain some uninitialized (ie: undefined) form fields so doesn't match the fully initialized schema
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
										?.slug}.{PUBLIC_ROOT_DOMAIN}/events/{$data.slug}</span
								>
								<ResponsiveModal title={t`Edit event link`} bind:open={editSlugOpen}>
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
											{t`This is a URL-friendly identifier for the event and is part of the event link.
											It must be unique and can only contain lowercase letters, numbers, and
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
					{#if $data.description && $data.description.length > 0}
						<InputGroup.Addon align="block-end" class="justify-end">
							<InputGroup.Text>{$data.description.length} / 1000</InputGroup.Text>
						</InputGroup.Addon>
					{/if}
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

{#snippet locationTabs()}
	<Tabs.Root value="physical" class="w-full">
		<Tabs.List>
			<Tabs.Trigger value="physical"><MapPinIcon class="size-4" /> {t`In person`}</Tabs.Trigger>
			<Tabs.Trigger value="virtual"><VideoIcon class="size-4" /> {t`Virtual`}</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="physical" class="mt-4 space-y-6">
			{@render addressBlock()}
		</Tabs.Content>
		<Tabs.Content value="virtual" class="mt-4 space-y-6">
			{@render videoCallBlock()}
		</Tabs.Content>
	</Tabs.Root>
{/snippet}

{#snippet addressBlock()}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="col-span-2">
			<Form.Field {form} name="addressLine1">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Address line 1`}</Form.Label>
						<InputGroup.Root>
							<InputGroup.Input
								bind:value={$data.addressLine1}
								{...props}
								placeholder={t`Address line 1`}
							/>
						</InputGroup.Root>
					{/snippet}
				</Form.Control>
			</Form.Field>
		</div>
		<div class="col-span-2">
			<Form.Field {form} name="addressLine2">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Address line 2 (optional)`}</Form.Label>
						<InputGroup.Root>
							<InputGroup.Input
								bind:value={$data.addressLine2}
								{...props}
								placeholder={t`Address line 2`}
							/>
						</InputGroup.Root>
					{/snippet}
				</Form.Control>
			</Form.Field>
		</div>
		<Form.Field {form} name="locality">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{t`City/town`}</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.locality} {...props} placeholder={t`City/town`} />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="region">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{t`Region/state`}</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.region} {...props} placeholder={t`Region/state`} />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="postcode">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{t`Postcode`}</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.postcode} {...props} placeholder={t`Postcode`} />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="country">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{t`Country`}</Form.Label>
					<InputGroup.Root>
						<InputGroup.Input bind:value={$data.country} {...props} placeholder={t`Country`} />
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
	</div>
{/snippet}

{#snippet videoCallBlock()}
	<Form.Field {form} name="onlineLink">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{t`Online link`}</Form.Label>
				<InputGroup.Root>
					<InputGroup.Input bind:value={$data.onlineLink} {...props} placeholder={t`Online link`} />
					<InputGroup.Addon>
						{#if $data.onlineLink && getMeetingPlatform($data.onlineLink) !== 'other'}
							<img
								src={getMeetingPlatformLogoUrl(getMeetingPlatform($data.onlineLink))}
								alt={getMeetingPlatform($data.onlineLink)}
								class="size-4"
							/>
						{:else}
							<LinkIcon class="size-4" />
						{/if}
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
	</Form.Field>
{/snippet}
