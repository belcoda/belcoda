<script lang="ts">
	import EmailForm from '$lib/components/communications/email/EmailForm.svelte';
	import { goto } from '$app/navigation';

	function handleSave(data: any) {
		console.log('Save new draft:', data);
		// TODO: Implement create draft mutation
	}

	function handleSend(data: any) {
		console.log('Send new email:', data);
		// TODO: Implement create and send mutation
	}

	function handleDiscard() {
		goto('/communications/email/drafts');
	}
</script>

<EmailForm email={null} onSave={handleSave} onSend={handleSend} onDiscard={handleDiscard} />
