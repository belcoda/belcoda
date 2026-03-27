<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import ProfileRow from './ProfileRow.svelte';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { toast } from 'svelte-sonner';
	import LongPressButton from '$lib/components/widgets/utils/LongPressButton.svelte';
	import { goto } from '$app/navigation';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	const { params } = $props();
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	const person = $derived.by(() => {
		return z.createQuery(queries.person.read({ personId: params.personId }));
	});

	import ProfilePicture from './ProfilePicture.svelte';
	import NameRow from './rows/Name.svelte';
	import EmailRow from './rows/Email.svelte';
	import PhoneRow from './rows/Phone.svelte';
	import AddressRow from './rows/Address.svelte';
	import PersonalInfoRow from './rows/PersonalInfo.svelte';
	import WorkplaceRow from './rows/Workplace.svelte';
	import NotesAction from '$lib/components/layouts/app/action-menus/person/NotesAction.svelte';
	import TeamsRow from './rows/Teams.svelte';
	import TagsRow from './rows/Tags.svelte';
	import { t } from '$lib/index.svelte';
</script>

<ContentLayout rootLink={`/community/${params.personId}`} {header}>
	{#if person.data}
		<div class="space-y-2">
			<div class="mx-auto max-w-xl space-y-4">
				<ProfilePicture person={person.data} />
				<NameRow person={person.data} />
				<EmailRow person={person.data} />
				<PhoneRow person={person.data} />
				<AddressRow person={person.data} />
				<TeamsRow person={person.data} />
				<TagsRow person={person.data} />
				<PersonalInfoRow person={person.data} />
				<WorkplaceRow person={person.data} />
				{#if appState.isAdminOrOwner}
					<Alert.Root variant="destructive" class="mt-8 mb-8">
						<AlertCircleIcon />
						<Alert.Title>{t`Danger zone!`}</Alert.Title>
						<Alert.Description>
							{t`Delete this person record permanently along with all associated data. Be careful, this action cannot be undone.`}

							<div class="mt-2">
								<LongPressButton
									duration={1500}
									onComplete={async () => {
										if (window.confirm(t`Are you sure you want to delete this person?`)) {
											z.mutate(
												mutators.person.delete({
													metadata: {
														personId: params.personId,
														organizationId: appState.organizationId
													}
												})
											);
											toast.success(t`Person deleted`);
											goto(`/community`);
										}
									}}
									>{t`Delete`}
								</LongPressButton>
							</div>
						</Alert.Description>
					</Alert.Root>
				{/if}
			</div>
		</div>
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-end">
		{#if person.data}
			<NotesAction person={person.data} currentPage="profile" />
		{:else}
			<Skeleton class="h-10 w-20 rounded-lg" />
		{/if}
	</div>
{/snippet}
