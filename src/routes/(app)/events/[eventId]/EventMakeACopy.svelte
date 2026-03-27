<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { type ReadEventZero } from '$lib/schema/event';
	import { type Snippet } from 'svelte';
	import { v7 as uuidv7 } from 'uuid';
	let {
		event,
		trigger,
		open = $bindable()
	}: { event: ReadEventZero; trigger?: Snippet; open: boolean } = $props();
	import { Button } from '$lib/components/ui/button/index.js';
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import createForm from '$lib/form.svelte';
	import { generateCreateEventZeroAsyncSchema } from '$lib/schema/event';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { slugify } from '$lib/utils/slug';
	const newEvent = {
		/* svelte-ignore state_referenced_locally */
		...event,
		/* svelte-ignore state_referenced_locally */
		title: `${t`Copy of`} ${event.title}`,
		/* svelte-ignore state_referenced_locally */
		slug: `copy-of-${event.slug}`,
		published: false,
		publishedAt: null,
		createdAt: new Date().getTime(),
		updatedAt: new Date().getTime(),
		deletedAt: null,
		archivedAt: null,
		cancelledAt: null
	};
	let { form, data, errors, Errors, Debug } = $state(
		createForm({
			schema: generateCreateEventZeroAsyncSchema(appState.organizationId ?? ''),
			initialData: newEvent,
			onSubmit: async (data) => {
				const eventId = uuidv7();
				const writeEvent = z.mutate(
					mutators.event.create({
						metadata: {
							organizationId: appState.organizationId,
							eventId: eventId
						},
						input: {
							...data,
							slug: slugify(data.title),
							startsAt: data.startsAt,
							endsAt: data.endsAt
						}
					})
				);
				await writeEvent.client;
				await goto(`/events/${eventId}`);
			}
		})
	);
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { appState } from '$lib/state.svelte';
	import { goto } from '$app/navigation';
</script>

<ResponsiveModal {trigger} bind:open>
	<form use:form.enhance class="mx-auto flex w-full max-w-4xl flex-col gap-4" id="event-form">
		<Errors {errors} />
		<Form.Field {form} name="title">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{t`Event title`}</Form.Label>
					<Input {...props} bind:value={$data.title} placeholder={t`Event title`} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Button type="submit">{t`Make a copy`}</Button>
		<Debug {data} hide={true} />
	</form>
</ResponsiveModal>
