<script lang="ts">
	import { t } from '$lib/index.svelte';

	import { toast } from 'svelte-sonner';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { goto } from '$app/navigation';

	import { type ReadOrganizationZero, updateOrganization } from '$lib/schema/organization';

	import createForm from '$lib/form.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import LanguageSelect from '$lib/components/ui/custom-select/language/language.svelte';
	import CountrySelect from '$lib/components/ui/custom-select/country/country.svelte';
	import TimezoneSelect from '$lib/components/ui/custom-select/timezone/timezone.svelte';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';

	const { organization }: { organization: ReadOrganizationZero } = $props();

	import { clampLanguageCode } from '$lib/utils/language';
	import { isValidCountryCode, type CountryCode } from '$lib/utils/country';

	let { form, data, errors, Errors, helpers } = createForm({
		schema: updateOrganization,
		/* svelte-ignore state_referenced_locally */
		initialData: organization,
		onSubmit: async (data) => {
			z.mutate(
				mutators.organization.update({
					metadata: {
						organizationId: organization.id
					},
					input: data
				})
			);
			toast.success(t`Organization configuration updated successfully`);
		},
		onSubmitComplete: async () => {
			await goto('/settings');
		}
	});
</script>

<Card.Root>
	<Card.Content>
		<form use:form.enhance id="org-config-form" class="grid grid-cols-1 gap-4">
			<Form.Field {form} name="country">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Country`}</Form.Label>
						<CountrySelect
							value={$data.country}
							onSelectChange={(v) => {
								if (isValidCountryCode(v)) {
									$data.country = v as CountryCode; //we have checked that it's a valid country code
								}
							}}
							{...props}
						/>
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="defaultLanguage">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Default Language`}</Form.Label>
						<LanguageSelect
							value={$data.defaultLanguage}
							onSelectChange={(v) => {
								$data.defaultLanguage = clampLanguageCode(v);
							}}
						/>
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="defaultTimezone">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Default Timezone`}</Form.Label>
						<TimezoneSelect
							class="w-full"
							value={$data.defaultTimezone}
							onSelectChange={(v) => {
								$data.defaultTimezone = v;
							}}
						/>
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="logo">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Organization logo`}</Form.Label>
						<CroppedImageUpload
							{...props}
							fileUrl={$data.logo}
							aspectRatio={16 / 9}
							onUpload={async (url) => {
								$data.logo = url;
							}}
							class="max-w-xs"
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>
					{t`URL to the organization logo. It will be displayed on some public pages (depending on other settings). Recommended size: 16:9 ratio. Max size: 2MB.`}
				</Form.Description>
			</Form.Field>
			<Form.Field {form} name="icon">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{t`Organization icon`}</Form.Label>
						<CroppedImageUpload
							{...props}
							fileUrl={$data.icon}
							aspectRatio={1 / 1}
							onUpload={async (url) => {
								$data.icon = url;
							}}
							class="max-w-xs"
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>
					{t`URL to the organization icon. It will be used in the menu and other Belcoda pages.Recommended size: 128x128px or 256x256px. Max size: 2MB.`}
				</Form.Description>
			</Form.Field>
		</form>
	</Card.Content>
</Card.Root>
