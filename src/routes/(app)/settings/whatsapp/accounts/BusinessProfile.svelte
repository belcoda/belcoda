<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import {
		WHATSAPP_PROFILE_VERTICAL_OPTIONS,
		type WhatsappBusinessProfile,
		type WhatsappPhoneNumberProfileVertical
	} from '$lib/schema/whatsapp/ycloud/profile';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ImageUploadNew from '$lib/components/ui/image-upload/ImageUploadNew.svelte';
	import { toast } from 'svelte-sonner';

	let profile = $state<WhatsappBusinessProfile | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let submitting = $state(false);

	let about = $state('');
	let description = $state('');
	let address = $state('');
	let email = $state('');
	let vertical = $state<WhatsappPhoneNumberProfileVertical>('OTHER');
	let website1 = $state('');
	let website2 = $state('');
	let profilePictureUrl = $state<string | null | undefined>(null);
	let imageUploading = $state(false);

	function applyProfileToForm(data: WhatsappBusinessProfile) {
		about = data.about ?? '';
		description = data.description ?? '';
		address = data.address ?? '';
		email = data.email ?? '';
		vertical = data.vertical ?? 'OTHER';
		website1 = data.websites?.[0] ?? '';
		website2 = data.websites?.[1] ?? '';
		profilePictureUrl = data.profilePictureUrl ?? null;
	}

	function formatNameStatus(status: string | null | undefined): string {
		if (!status) return t`—`;
		return status
			.toLowerCase()
			.split('_')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	}

	function getVerticalLabel(value: string): string {
		return (
			WHATSAPP_PROFILE_VERTICAL_OPTIONS.find((option) => option.value === value)?.label ?? value
		);
	}

	async function loadProfile() {
		const organizationId = appState.organizationId;
		if (!organizationId) {
			error = t`No active organization`;
			loading = false;
			return;
		}

		loading = true;
		error = null;
		try {
			const response = await fetch(
				`/api/utils/whatsapp/profile?organizationId=${encodeURIComponent(organizationId)}`
			);
			if (!response.ok) {
				const message = await response.text();
				throw new Error(message || t`Failed to load WhatsApp business profile`);
			}
			const data = await response.json();
			profile = data.profile as WhatsappBusinessProfile;
			applyProfileToForm(profile);
		} catch (err) {
			error = err instanceof Error ? err.message : t`Failed to load WhatsApp business profile`;
		} finally {
			loading = false;
		}
	}

	async function saveProfile() {
		const organizationId = appState.organizationId;
		if (!organizationId) {
			toast.error(t`No active organization`);
			return;
		}

		const aboutTrimmed = about.trim();
		if (!aboutTrimmed) {
			toast.error(t`About is required and cannot be empty`);
			return;
		}

		submitting = true;
		error = null;
		try {
			const websites = [website1.trim(), website2.trim()].filter(Boolean);
			const response = await fetch(
				`/api/utils/whatsapp/profile?organizationId=${encodeURIComponent(organizationId)}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						about: aboutTrimmed,
						description: description.trim(),
						address: address.trim(),
						email: email.trim(),
						vertical,
						websites: websites.length > 0 ? websites : [],
						profilePictureUrl: profilePictureUrl?.trim() ?? ''
					})
				}
			);
			if (!response.ok) {
				const message = await response.text();
				throw new Error(message || t`Failed to save WhatsApp business profile`);
			}
			const data = (await response.json()) as WhatsappBusinessProfile;
			profile = data;
			applyProfileToForm(data);
			toast.success(t`WhatsApp business profile saved`);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : t`Failed to save WhatsApp business profile`;
			error = message;
			toast.error(message);
		} finally {
			submitting = false;
		}
	}

	onMount(() => {
		void loadProfile();
	});
</script>

<Card.Root class="mt-4" data-testid="whatsapp-business-profile-card">
	<Card.Header>
		<Card.Title>{t`Business profile`}</Card.Title>
		<Card.Description>
			{t`Manage how your business appears on WhatsApp. Verified name and name status are set by Meta.`}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if loading}
			<div class="space-y-4">
				<Skeleton class="h-20 w-full rounded-lg" />
				<div class="grid gap-4 sm:grid-cols-2">
					<Skeleton class="h-16 w-full rounded-lg" />
					<Skeleton class="h-16 w-full rounded-lg" />
				</div>
				<Skeleton class="h-52 w-full rounded-lg" />
			</div>
		{:else if error && !profile}
			<Alert.Root variant="destructive">
				<Alert.Title>{t`Error`}</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{:else if profile}
			<div>
				<Alert.Root class="border-amber-300 bg-amber-50/60 text-amber-950">
					<Alert.Title>{t`Heads up`}</Alert.Title>
					<Alert.Description class="text-amber-950/90">
						{t`Updates to your WhatsApp Business profile can take time to propagate. After saving changes, wait at least 10 minutes before submitting another update, and confirm the latest values directly in WhatsApp first.`}
					</Alert.Description>
				</Alert.Root>
			</div>

			{#if error}
				<Alert.Root variant="destructive">
					<Alert.Title>{t`Error`}</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label>{t`Verified name`}</Label>
					<p class="text-sm text-muted-foreground" data-testid="whatsapp-profile-verified-name">
						{profile.verifiedName ?? t`—`}
					</p>
				</div>
				<div class="space-y-2">
					<Label>{t`Name status`}</Label>
					<p class="text-sm text-muted-foreground" data-testid="whatsapp-profile-name-status">
						{formatNameStatus(profile.nameStatus)}
					</p>
				</div>
			</div>

			<form
				class="space-y-4"
				onsubmit={(event) => {
					event.preventDefault();
					void saveProfile();
				}}
			>
				<div class="space-y-2">
					<Label>{t`Profile picture`}</Label>
					<div data-testid="whatsapp-profile-picture-upload">
						<ImageUploadNew
							bind:loading={imageUploading}
							bind:fileUrl={profilePictureUrl}
							crop={{ aspectRatio: 1 }}
							class="aspect-square w-48"
							onUpload={(url) => {
								profilePictureUrl = url;
							}}
						/>
					</div>
					<p class="text-xs text-muted-foreground">
						{t`Upload a square image. Save the profile to apply changes on WhatsApp.`}
					</p>
				</div>

				<div class="space-y-2">
					<Label for="whatsapp-profile-about">{t`About`}</Label>
					<Input
						id="whatsapp-profile-about"
						bind:value={about}
						maxlength={139}
						data-testid="whatsapp-profile-about"
					/>
					<p class="text-xs text-muted-foreground">{about.length}/139</p>
				</div>

				<div class="space-y-2">
					<Label for="whatsapp-profile-description">{t`Description`}</Label>
					<Textarea
						id="whatsapp-profile-description"
						bind:value={description}
						maxlength={512}
						class="min-h-24"
						data-testid="whatsapp-profile-description"
					/>
					<p class="text-xs text-muted-foreground">{description.length}/512</p>
				</div>

				<div class="space-y-2">
					<Label for="whatsapp-profile-address">{t`Address`}</Label>
					<Input
						id="whatsapp-profile-address"
						bind:value={address}
						maxlength={256}
						data-testid="whatsapp-profile-address"
					/>
				</div>

				<div class="space-y-2">
					<Label for="whatsapp-profile-email">{t`Email`}</Label>
					<Input
						id="whatsapp-profile-email"
						type="email"
						bind:value={email}
						maxlength={128}
						data-testid="whatsapp-profile-email"
					/>
				</div>

				<div class="space-y-2">
					<Label>{t`Industry`}</Label>
					<Select.Root type="single" bind:value={vertical}>
						<Select.Trigger class="w-full" data-testid="whatsapp-profile-vertical">
							{getVerticalLabel(vertical)}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each WHATSAPP_PROFILE_VERTICAL_OPTIONS as option (option.value)}
									<Select.Item value={option.value} label={option.label}>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<Label for="whatsapp-profile-website-1">{t`Website 1`}</Label>
					<Input
						id="whatsapp-profile-website-1"
						type="url"
						placeholder="https://"
						bind:value={website1}
						maxlength={255}
						data-testid="whatsapp-profile-website-1"
					/>
				</div>

				<div class="space-y-2">
					<Label for="whatsapp-profile-website-2">{t`Website 2`}</Label>
					<Input
						id="whatsapp-profile-website-2"
						type="url"
						placeholder="https://"
						bind:value={website2}
						maxlength={255}
						data-testid="whatsapp-profile-website-2"
					/>
				</div>

				<Button
					type="submit"
					disabled={submitting || imageUploading}
					data-testid="whatsapp-profile-save"
				>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
					{/if}
					{t`Save profile`}
				</Button>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
