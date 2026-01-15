<script lang="ts">
	import { t } from '$lib';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { ColorPicker } from '$lib/components/ui/color-picker/index.js';
	import { post } from '$lib/utils/http';
	import { object, boolean } from 'valibot';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { readOrganization } from '$lib/zero/query/organizations/read';

	const organization = appState.activeOrganization;
	const themeSettings = $derived(
		(organization.data?.settings as any)?.theme || {
			logo: null,
			primaryColor: null,
			secondaryColor: null
		}
	);

	// Form state
	let logo = $state<string | null>(null);
	let primaryColor = $state<string | null>(null);
	let secondaryColor = $state<string | null>(null);

	let saving = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	function syncFormState() {
		const currentTheme = (organization.data?.settings as any)?.theme;
		if (currentTheme) {
			logo = currentTheme.logo;
			primaryColor = currentTheme.primaryColor;
			secondaryColor = currentTheme.secondaryColor;
		} else {
			logo = null;
			primaryColor = null;
			secondaryColor = null;
		}
	}

	async function handleSave() {
		if (!appState.organizationId) {
			error = 'Organization ID not found';
			return;
		}

		saving = true;
		error = null;
		success = false;

		try {
			await post({
				path: '/api/organization/update',
				schema: object({ success: boolean() }),
				body: {
					organizationId: appState.organizationId,
					settings: {
						theme: {
							logo,
							primaryColor,
							secondaryColor
						}
					}
				}
			});

			success = true;
			// Refresh organization data
			organization.updateQuery(
				readOrganization(appState.queryContext, { organizationId: appState.organizationId }),
				true
			);

			// Sync form state after a short delay to allow query to complete
			setTimeout(() => {
				syncFormState();
			}, 100);

			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save theme settings';
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		// Reset to original values
		syncFormState();
		error = null;
		success = false;
	}
</script>

<ContentLayout rootLink="/settings">
	{#if organization.details.type === 'complete' && organization.data}
		{#key organization.data.id}
			{@const _ = syncFormState()}
			<Card.Root>
				<Card.Header>
					<Card.Title>{t`Display Settings`}</Card.Title>
					<Card.Description>
						{t`Customize how your workspace appears on public pages like event calendars and event signup pages.`}
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<div class="space-y-2">
						<div class="text-sm font-medium">{t`Tab Icon URL`}</div>
						<CroppedImageUpload
							fileUrl={logo}
							aspectRatio={1}
							onUpload={async (url) => {
								logo = url;
							}}
							class="max-w-xs"
						/>
						<p class="text-sm text-muted-foreground">
							{t`URL to an icon that will appear in browser tabs for public pages. Recommended size: 32x32px or 64x64px.`}
						</p>
					</div>

					<ColorPicker
						bind:value={primaryColor}
						label={t`Primary Color`}
						description={t`Main color for buttons, links, and primary accents on public pages.`}
					/>

					<ColorPicker
						bind:value={secondaryColor}
						label={t`Secondary Color`}
						description={t`Accent color for success states and secondary elements on public pages.`}
					/>

					{#if error}
						<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					{/if}

					{#if success}
						<div class="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
							{t`Theme settings saved successfully.`}
						</div>
					{/if}
				</Card.Content>
				<Card.Footer class="flex justify-end gap-2">
					<Button variant="outline" onclick={handleCancel} disabled={saving}>
						{t`Cancel`}
					</Button>
					<Button onclick={handleSave} disabled={saving}>
						{saving ? t`Saving...` : t`Save Changes`}
					</Button>
				</Card.Footer>
			</Card.Root>
		{/key}
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
