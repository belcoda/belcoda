<script lang="ts">
	import { t } from '$lib';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { ColorPicker } from '$lib/components/ui/color-picker/index.js';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';
	import createForm from '$lib/form.svelte';
	import { themeSettingsSchema, defaultThemeSettings } from '$lib/schema/organization/settings';
	import type { OrganizationSettingsSchema } from '$lib/schema/organization/settings';

	const organization = appState.activeOrganization;

	let { form, data, helpers } = $state(
		createForm({
			schema: themeSettingsSchema,
			initialData: (organization.data?.settings as OrganizationSettingsSchema)?.theme || defaultThemeSettings(),
			validateOnLoad: false,
			onSubmit: async (formData) => {
				if (!appState.organizationId) {
					toast.error(t`Organization ID not found`);
					return;
				}

				try {
					const response = z.mutate.organization.updateTheme({
						metadata: {
							organizationId: appState.organizationId
						},
						input: {
							favicon: formData.favicon,
							primaryColor: formData.primaryColor,
							secondaryColor: formData.secondaryColor
						}
					});

					await response.server;
					toast.success(t`Theme settings saved successfully.`);
				} catch (err) {
					toast.error(err instanceof Error ? err.message : t`Failed to save theme settings`);
				}
			}
		})
	);
</script>

<ContentLayout rootLink="/settings">
	{#if organization.details.type === 'complete' && organization.data}
		<form use:form.enhance>
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Display Settings`}</Card.Title>
					<Card.Description>
						{t`Customize how your workspace appears on public pages like event calendars and event signup pages.`}
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<Form.Field {form} name="favicon">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{t`Tab Icon URL`}</Form.Label>
								<CroppedImageUpload
									{...props}
									fileUrl={$data.favicon}
									aspectRatio={1}
									onUpload={async (url) => {
										$data.favicon = url;
									}}
									class="max-w-xs"
								/>
							{/snippet}
						</Form.Control>
						<Form.Description>
							{t`URL to an icon that will appear in browser tabs for public pages. Recommended size: 32x32px or 64x64px.`}
						</Form.Description>
					</Form.Field>

					<Form.Field {form} name="primaryColor">
						<ColorPicker
							bind:value={$data.primaryColor}
							label={t`Primary Color`}
							description={t`Main color for buttons, links, and primary accents on public pages.`}
						/>
					</Form.Field>

					<Form.Field {form} name="secondaryColor">
						<ColorPicker
							bind:value={$data.secondaryColor}
							label={t`Secondary Color`}
							description={t`Accent color for success states and secondary elements on public pages.`}
						/>
					</Form.Field>
				</Card.Content>
				<Card.Footer class="flex justify-end gap-2">
					<Button
						variant="outline"
						type="button"
						onclick={() => {
							helpers.warnBeforeDiscard(helpers.isTainted, () => {
								form.reset();
							});
						}}
					>
						{t`Cancel`}
					</Button>
					<Button type="submit">
						{t`Save Changes`}
					</Button>
				</Card.Footer>
			</Card.Root>
		</form>
	{:else}
		<div class="text-center text-muted-foreground">
			<p>{t`Failed to load organization settings.`}</p>
		</div>
	{/if}

	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>{t`Theme Settings`}</H2>
		</div>
	{/snippet}
</ContentLayout>
