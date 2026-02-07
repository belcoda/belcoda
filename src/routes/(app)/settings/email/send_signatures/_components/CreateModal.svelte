<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { type Snippet } from 'svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { parse } from 'valibot';
	import {
		createEmailFromSignature,
		createMutatorSchemaZero,
		type CreateMutatorSchemaZeroInput
	} from '$lib/schema/email-from-signature';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { z } from '$lib/zero.svelte';
	import { getAppState } from '$lib/state.svelte';
	const appState = getAppState();
	import { v7 as uuidv7 } from 'uuid';
	import { t } from '$lib/index.svelte';
	import { toast } from 'svelte-sonner';
	import { isSubdomain } from '$lib/utils/string/domain';

	type Props = {
		trigger: Snippet;
		onCreated?: () => void;
	};

	let { trigger, onCreated }: Props = $props();

	let isOpen = $state(false);
	const emailFromSignatureId = uuidv7();

	const { form, data, errors, Errors, helpers } = createForm({
		schema: createEmailFromSignature,
		validateOnLoad: false,
		onSubmit: async (formData) => {
			const toCreate: CreateMutatorSchemaZeroInput = {
				input: {
					name: formData.name,
					emailAddress: formData.emailAddress,
					replyTo: formData.replyTo || null,
					returnPathDomain: formData.returnPathDomain || null
				},
				metadata: {
					organizationId: appState.organizationId,
					emailFromSignatureId: emailFromSignatureId
				}
			};

			try {
				if (toCreate.input.returnPathDomain) {
					const emailDomain = toCreate.input.emailAddress.split('@')[1]?.toLowerCase();
					const returnDomain = toCreate.input.returnPathDomain.toLowerCase();
					if (!emailDomain || !isSubdomain(returnDomain, emailDomain)) {
						throw new Error(
							`Return path domain must be a subdomain of ${emailDomain || 'the email domain'}.`
						);
					}
				}
				const parsed = parse(createMutatorSchemaZero, toCreate);
				const response = z.mutate.emailFromSignature.create(parsed);
				await response.server;
				toast.success(t`Email signature created successfully`);
				isOpen = false;
				onCreated?.();
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : t`Failed to create email signature`;
				toast.error(errorMessage);
				throw err;
			}
		}
	});
</script>

<ResponsiveModal
	title={t`Add Email from signature`}
	description={t`Create a new email signature that will be verified with Postmark.`}
	{trigger}
	bind:open={isOpen}
>
	{#snippet children()}
		<form use:form.enhance class="space-y-4">
			<Errors {errors} />
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Display name`}</Form.Label>
						<Input {...props} bind:value={$data.name} placeholder={t`Display name`} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="emailAddress">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Email address`}</Form.Label>
						<Input
							{...props}
							type="email"
							bind:value={$data.emailAddress}
							placeholder={t`email@example.com`}
							class="font-mono"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
				<Form.Description>{t`The email address must be verified with Postmark.`}</Form.Description>
			</Form.Field>

			<Form.Field {form} name="replyTo">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Reply-to address`}</Form.Label>
						<Input
							{...props}
							type="email"
							bind:value={$data.replyTo}
							placeholder={t`reply@example.com`}
							class="font-mono"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
				<Form.Description
					>{t`Optional. If not set, replies will go to the email address above.`}</Form.Description
				>
			</Form.Field>

			<Form.Field {form} name="returnPathDomain">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Return path domain`}</Form.Label>
						<Input
							{...props}
							bind:value={$data.returnPathDomain}
							placeholder={t`bounce.example.com`}
							class="font-mono"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
				<Form.Description
					>{t`Optional. The return path domain is used for bounce handling.`}</Form.Description
				>
			</Form.Field>
		</form>
	{/snippet}

	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button variant="outline" onclick={() => (isOpen = false)}>{t`Cancel`}</Button>
			<Button
				onclick={() => {
					form.submit();
				}}
			>
				{t`Create signature`}
			</Button>
		</div>
	{/snippet}
</ResponsiveModal>
