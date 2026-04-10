<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { z } from '$lib/zero.svelte';
	import { getListFilter, appState } from '$lib/state.svelte';
	import queries from '$lib/zero/query/index';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import NewTeam from './NewTeam.svelte';
	import EditTeam from './EditTeam.svelte';
	import { formatDate } from '$lib/utils/date';

	let teamListFilter = $state({
		...getListFilter(appState.organizationId)
	});
	const teamList = $derived.by(() => z.createQuery(queries.team.list(teamListFilter)));
</script>

<ContentLayout rootLink="/settings">
	<div class="space-y-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>{t`Teams`}</Card.Title>
				<Card.Description>
					{t`Manage teams for organizing people and users.`}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>{t`Name`}</Table.Head>
							<Table.Head>{t`Created`}</Table.Head>
							<Table.Head class="w-[80px] text-right">{t`Actions`}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if teamList.data && teamList.data.length === 0}
							<Table.Row>
								<Table.Cell colspan={3} class="py-12 text-center text-muted-foreground">
									{t`No teams yet. Create your first team to get started.`}
								</Table.Cell>
							</Table.Row>
						{:else if teamList.data}
							{#each teamList.data as team (team.id)}
								<Table.Row data-testid="team-row" data-team-id={team.id}>
									<Table.Cell class="font-medium">
										<a
											href="/settings/teams/{team.id}"
											class="hover:underline focus:underline focus:outline-none"
											data-testid="team-row-name"
										>
											{team.name}
										</a>
									</Table.Cell>
									<Table.Cell class="text-muted-foreground">{formatDate(team.createdAt)}</Table.Cell
									>
									<Table.Cell class="text-right">
										<EditTeam {team} />
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={3} class="py-8 text-center text-muted-foreground">
									{t`Loading teams...`}
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<H2>{t`Teams`}</H2>
			<NewTeam />
		</div>
	{/snippet}
</ContentLayout>
