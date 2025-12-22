<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href="/" class="flex items-center gap-2 self-center font-medium">
			<div
				class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
			>
				<img src="/logos/white_logomark.svg" alt="logo" class="size-4" />
			</div>
			Belcoda
		</a>
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title class="text-xl">Email Verified</Card.Title>
				<Card.Description>Your email has been successfully verified</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-4">
				<div class="rounded border border-green-800 bg-green-50 p-4 text-sm text-green-800 text-center">
					<p>Your email address has been verified. You can now sign in to your account.</p>
				</div>
				<Button class="w-full" onclick={() => goto('/login')}> Go to Login </Button>
			</Card.Content>
		</Card.Root>
	</div>
</div>

