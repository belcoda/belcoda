<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { ReadOrganizationZero } from '$lib/schema/organization';
	import { SHORT_STRING_MAX_LENGTH } from '$lib/schema/helpers';
	import { createTeam } from '$lib/schema/team';
	import { safeParse } from 'valibot';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { v7 as uuidv7 } from 'uuid';

	let {
		organization,
		oncreated
	}: {
		organization: Pick<ReadOrganizationZero, 'id' | 'settings'>;
		oncreated: (name: string) => void;
	} = $props();
	let teamName = $state('');
	let saving = $state(false);
	let error = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (saving) return;
		error = '';
		const parsed = safeParse(createTeam, { name: teamName, parentTeamId: null });
		if (!parsed.success) {
			error = t`Enter a team name between 1 and ${String(SHORT_STRING_MAX_LENGTH)} characters.`;
			return;
		}
		saving = true;
		try {
			const result = await z.mutate(
				mutators.team.createForOnboarding({
					metadata: {
						organizationId: organization.id,
						teamId: uuidv7(),
						existingSettings: organization.settings
					},
					input: parsed.output
				})
			).server;
			if (result.type === 'error') throw new Error(result.error.message);
			oncreated(parsed.output.name);
		} catch {
			error = t`We couldn't create your team. Please try again, or use a different name if this team already exists.`;
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-3">
	<Label for="onboarding-team-name">{t`Team name`}</Label>
	<Input
		id="onboarding-team-name"
		bind:value={teamName}
		placeholder={t`e.g. Field organisers`}
		disabled={saving}
		aria-invalid={!!error}
		aria-describedby={error ? 'onboarding-team-error' : undefined}
	/>
	{#if error}<p id="onboarding-team-error" role="alert" class="text-sm text-destructive">
			{error}
		</p>{/if}
	<Button type="submit" variant="outline" class="self-start" disabled={saving || !teamName.trim()}>
		{saving ? t`Creating team…` : t`Create team`}
	</Button>
</form>
