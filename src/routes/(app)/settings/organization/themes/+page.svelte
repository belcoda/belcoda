<script lang="ts">
	import { t } from '$lib';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { ColorPicker } from '$lib/components/ui/color-picker/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';

	const organization = appState.activeOrganization;
	const themeSettings = $derived(
		(organization.data?.settings as any)?.theme || {
			favicon: null,
			primaryColor: null,
			secondaryColor: null
		}
	);

	// Form state
	let favicon = $state<string | null>(null);
	let primaryColor = $state<string | null>(null);
	let secondaryColor = $state<string | null>(null);

	let saving = $state(false);

	function syncFormState() {
		const currentTheme = (organization.data?.settings as any)?.theme;
		if (currentTheme) {
			favicon = currentTheme.favicon;
			primaryColor = currentTheme.primaryColor;
			secondaryColor = currentTheme.secondaryColor;
		} else {
			favicon = null;
			primaryColor = null;
			secondaryColor = null;
		}
	}

	if (organization.data?.settings) {
		syncFormState();
	}

	async function handleSave() {
		if (!appState.organizationId) {
			toast.error('Organization ID not found');
			return;
		}

		saving = true;

		try {
			const response = z.mutate.organization.updateTheme({
				metadata: {
					organizationId: appState.organizationId
				},
				input: {
					favicon,
					primaryColor,
					secondaryColor
				}
			});

			await response.server;
			toast.success(t`Theme settings saved successfully.`);
			syncFormState();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save theme settings');
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		syncFormState();
	}
</script>

<ContentLayout rootLink="/settings">
	{#if organization.details.type === 'complete' && organization.data}
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
						fileUrl={favicon}
						aspectRatio={1}
						onUpload={async (url) => {
							favicon = url;
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
