<script lang="ts" module>
	export type Props = {
		children: Snippet;
		language?: string;
		copyright: string;
	};
</script>

<script lang="ts">
	import {
		Body,
		Column,
		Container,
		Head,
		Html,
		Row,
		Section,
		Text
	} from '@better-svelte-email/components';

	import type { Snippet } from 'svelte';

	let {
		language = 'en',
		children,
		copyright = `Copyright ${new Date().getFullYear()} Belcoda. All rights reserved.`
	}: Props = $props();
</script>

<Html lang={language} class="font-sans">
	<Head>
		<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
	</Head>
	<Body>
		<Container class="mx-auto w-full max-w-xl">
			<Section class="rounded-lg  bg-white mt-8 p-6 sm:px-9">
				<Row>
					<Column>
						{@render children()}
					</Column>
				</Row>
			</Section>

			<Section class="w-full">
				<Text class="m-0 px-9 py-6 text-center text-xs leading-5 text-slate-500">
					{copyright}
				</Text>
			</Section>
		</Container>
	</Body>
</Html>
