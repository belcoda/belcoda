<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { deleteMutatorSchemaZero } from '$lib/schema/person-note';
	import { z } from '$lib/zero.svelte';
	import { parse } from 'valibot';
	import { toast } from 'svelte-sonner';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import { t } from '$lib/index.svelte';
	let {
		noteId,
		personId,
		organizationId,
		userId
	}: { noteId: string; personId: string; organizationId: string; userId: string } = $props();
	function deleteNote() {
		const parsed = parse(deleteMutatorSchemaZero, {
			metadata: {
				personId: personId,
				userId: appState.userId,
				organizationId: appState.organizationId,
				personNoteId: noteId
			}
		});
		const input = z.mutate.personNote.delete(parsed);
		toast.success(t`Note deleted`);
	}
</script>

<Button variant="destructive" type="button" size="sm" onclick={() => deleteNote()}>{t`Delete`}</Button>
