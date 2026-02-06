<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { dropAllDatabases } from '@rocicorp/zero';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { dev } from '$app/environment';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	onMount(async () => {
		try {
			await dropAllDatabases();
			const { data, error } = await authClient.signOut();
			if (dev) console.log(data, error);
		} catch (error) {
			if (dev) console.error(error);
		} finally {
			await goto('/login'); // redirect to login page
		}
	});
</script>

<AuthLayout link="/" title={t`Logging out...`} description={t`Please wait while we log you out...`}>
	<div class="my-12 flex justify-center">
		<Spinner />
	</div>
</AuthLayout>
