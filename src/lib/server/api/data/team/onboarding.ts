import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { parse } from 'valibot';
import { createOnboardingTeamSchema, type CreateOnboardingTeam } from '$lib/schema/team';
import { createTeam } from './team';
import { updateOrganizationOnboarding } from '$lib/server/api/data/organization';

export async function createOnboardingTeam({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateOnboardingTeam;
}) {
	const parsed = parse(createOnboardingTeamSchema, args);
	await createTeam({ tx, ctx, args: parsed });
	await updateOrganizationOnboarding({
		tx,
		ctx,
		args: { metadata: parsed.metadata, input: { team: 'complete' } }
	});
}
