<script lang="ts">
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { type Readable } from 'svelte/store';
	import { t } from '$lib/index.svelte';
	type Errors = Readable<
		{
			path: string;
			messages: string[];
		}[]
	>;
	const { errors }: { errors: Errors } = $props();
</script>

{#if $errors.length > 0}
	<div
		class="flex gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
		role="alert"
	>
		<div class="size-4"><CircleAlertIcon class="mt-1 size-4" /></div>
		<span class="sr-only">{t`There are some errors that need to be fixed`}</span>
		<div>
			{#each $errors as error}
				<div>
					<ul class="list-outside list-disc pl-4">
						<li>
							{#if error.path === '_errors'}
								<strong>{error.messages.join('. ')}</strong>
							{:else}
								<strong class="capitalize">{error.path}:</strong> {error.messages.join('. ')}
							{/if}
						</li>
					</ul>
				</div>
			{/each}
		</div>
	</div>
{/if}
