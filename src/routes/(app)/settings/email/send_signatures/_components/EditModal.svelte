<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { type Snippet } from 'svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import createForm from '$lib/form.svelte';
	import { parse } from 'valibot';
	import {
		updateEmailFromSignatureZero,
		updateMutatorSchemaZero,
		type UpdateMutatorSchemaZeroInput
	} from '$lib/schema/email-from-signature';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib';
	import { toast } from 'svelte-sonner';
	import type { ReadEmailFromSignatureZero } from '$lib/schema/email-from-signature';
	import { isSubdomain } from '$lib/utils/string/domain';

	type Props = {
		trigger: Snippet;
		signature: ReadEmailFromSignatureZero;
		onUpdated?: () => void;
	};

	let { trigger, signature, onUpdated }: Props = $props();

	let isOpen = $state(false);

	const { form, data, errors, Errors, helpers } = createForm({
		schema: updateEmailFromSignatureZero,
		initialData: {
			name: signature.name,
			replyTo: signature.replyTo || null,
			returnPathDomain: signature.returnPathDomain || null
		},
		validateOnLoad: false,
		onSubmit: async (formData) => {
			const toUpdate: UpdateMutatorSchemaZeroInput = {
				input: {
					...(formData.name !== undefined && { name: formData.name }),
					...(formData.replyTo !== undefined && { replyTo: formData.replyTo || null }),
					...(formData.returnPathDomain !== undefined && {
						returnPathDomain: formData.returnPathDomain || null
					})
				},
				metadata: {
					organizationId: appState.organizationId,
					emailFromSignatureId: signature.id
				}
			};

			try {
				if (toUpdate.input.returnPathDomain) {
					const emailDomain = signature.emailAddress.split('@')[1]?.toLowerCase();
					const returnDomain = toUpdate.input.returnPathDomain.toLowerCase();
					if (!emailDomain || !isSubdomain(returnDomain, emailDomain)) {
						throw new Error(
							`Return path domain must be a subdomain of ${emailDomain || 'the email domain'}.`
						);
					}
				}
				const parsed = parse(updateMutatorSchemaZero, toUpdate);
				const response = z.mutate.emailFromSignature.update(parsed);
				await response.server;
				toast.success(t`Email signature updated successfully`);
				isOpen = false;
				onUpdated?.();
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : t`Failed to update email signature`;
				toast.error(errorMessage);
				throw err;
			}
		}
	});
</script>

<ResponsiveModal
	title={t`Edit Email from signature`}
	description={t`Update the email signature details.`}
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

			<div>
				<Form.Label>{t`Email address`}</Form.Label>
				<p class="text-sm text-muted-foreground font-mono mt-1">{signature.emailAddress}</p>
				<Form.Description>{t`The email address cannot be changed.`}</Form.Description>
			</div>

			<Form.Field {form} name="replyTo">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Reply-to address`}</Form.Label>
						<Input
							{...props}
							type="email"
							bind:value={$data.replyTo}
							placeholder={signature.emailAddress}
							class="font-mono"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
				<Form.Description>{t`Optional. If not set, replies will go to the email address above.`}</Form.Description>
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
				<Form.Description>{t`Optional. The return path domain is used for bounce handling.`}</Form.Description>
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
				{t`Save changes`}
			</Button>
		</div>
	{/snippet}
</ResponsiveModal>
