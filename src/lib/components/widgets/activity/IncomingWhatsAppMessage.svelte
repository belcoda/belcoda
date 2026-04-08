<script lang="ts">
	import { type ReadActivityZero } from '$lib/schema/activity';
	import Reply from '@lucide/svelte/icons/reply';
	type Props = {
		activity: ReadActivityZero;
	};

	const { activity }: Props = $props();
	console.assert(
		activity.type === 'whatsapp_message_outgoing',
		'Activity type must be incoming_whatsapp_message'
	);
	import { formatShortTimestamp } from '$lib/utils/date';
	import { locale } from '$lib/index.svelte';
	import EmojiSelector from '$lib/components/widgets/whatsapp/EmojiSelector.svelte';
	import EmojiReactions from '$lib/components/widgets/whatsapp/EmojiReactions.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import type { EmojiReaction } from '$lib/schema/whatsapp/message';

	const whatsappMessage = $derived.by(() => {
		return z.createQuery(queries.whatsappMessage.read({ whatsappMessageId: activity.referenceId }));
	});
</script>

{#if whatsappMessage.data}
	{@const emojiReactionFromBelcoda = whatsappMessage.data.message.emojiReactions?.find(
		(reaction) => reaction.viaBelcoda
	)}
	<div class="mb-4 flex items-center gap-1.5">
		{#if whatsappMessage.data.message.audio_url}
			<div
				class="w-md rounded-lg bg-gray-50 p-2"
				class:rounded-b-none={whatsappMessage.data.message.text ||
					(whatsappMessage.data.message.buttons?.length ?? 0) > 0}
			>
				<audio
					class="w-full"
					src={whatsappMessage.data.message.audio_url}
					controls
					preload="metadata"
				>
					Your browser does not support the audio tag.
				</audio>
				<div class="me-4 mt-1 flex w-full justify-end text-[11px] text-[#667781]">
					{formatShortTimestamp(activity.createdAt, locale.current)}
				</div>
				<EmojiReactions
					reactions={whatsappMessage.data.message.emojiReactions as EmojiReaction[]}
				/>
			</div>
		{:else if whatsappMessage.data.message.sticker_url}
			<div class="max-w-xs rounded-lg">
				<img
					src={whatsappMessage.data.message.sticker_url}
					alt="Whatsapp sticker"
					class="rounded-xl"
				/>
				<div class="me-4 mt-1 flex w-full justify-end text-[11px] text-[#667781]">
					{formatShortTimestamp(activity.createdAt, locale.current)}
				</div>
				<EmojiReactions
					reactions={whatsappMessage.data.message.emojiReactions as EmojiReaction[]}
				/>
			</div>
		{:else}
			<div class="message-bubble message-received relative min-w-[150px]">
				{#if whatsappMessage.data.message.image_url}
					<img
						class="h-auto w-full rounded-lg"
						class:rounded-b-none={whatsappMessage.data.message.text ||
							(whatsappMessage.data.message.buttons?.length ?? 0) > 0}
						src={whatsappMessage.data.message.image_url}
						alt="Whatsapp message"
					/>
				{/if}
				{#if whatsappMessage.data.message.video_url}
					<video
						class="h-auto w-full rounded-lg"
						class:rounded-b-none={whatsappMessage.data.message.text ||
							(whatsappMessage.data.message.buttons?.length ?? 0) > 0}
						src={whatsappMessage.data.message.video_url}
						controls
						preload="metadata"
					>
						<track
							kind="captions"
							src="/utils/empty-captions.vtt"
							srcLang="en"
							label="No captions available"
							default
						/>
						Your browser does not support the video tag.
					</video>
				{/if}
				{#if whatsappMessage.data.message.text}
					<div class="message-text">{whatsappMessage.data.message.text}</div>
				{/if}
				<div
					class="message-time flex items-center justify-end gap-2 text-[#667781]"
					class:absolute={!whatsappMessage.data.message.text}
					class:bottom-0={!whatsappMessage.data.message.text}
					class:right-0={!whatsappMessage.data.message.text}
					class:z-70={!whatsappMessage.data.message.text}
					class:text-white={!whatsappMessage.data.message.text}
				>
					{formatShortTimestamp(activity.createdAt, locale.current)}
				</div>
				{#if whatsappMessage.data.message.buttons?.length && whatsappMessage.data.message.buttons.length > 0}
					<div class="divide-y divide-gray-200 border-t border-gray-200">
						{#each whatsappMessage.data.message.buttons as button}
							<button
								class="relative flex w-full items-center justify-center gap-2 py-1.5 text-center text-sm text-gray-600"
							>
								<Reply class="size-4" />
								{button.text}
							</button>
						{/each}
					</div>
				{/if}
				<EmojiReactions
					reactions={whatsappMessage.data.message.emojiReactions as EmojiReaction[]}
				/>
			</div>
		{/if}
		<EmojiSelector
			hideIfSelected={true}
			onTapSelectedEmojiBehaviour="select"
			onEmojiSelect={(emoji) => {
				console.log(emoji);
				/* z.current.mutate.whatsappMessage.emojiReaction({
					reaction: emoji,
					personId: activity.personId,
					activity: $state.snapshot(activity),
					workspacePhoneNumber: page.data.workspace.settings.whatsApp.number
				}); */
			}}
			selectedEmoji={emojiReactionFromBelcoda?.emoji}
			class="rounded-full p-1 text-gray-400 transition-colors hover:scale-110 hover:bg-gray-100 hover:text-gray-600"
		/>
	</div>
{/if}

<style>
	/*
	Leaving some unnecessary styles here for now.
	Will refactor later.
	*/
	.message-bubble {
		max-width: 65%;
		border-radius: 7.5px;
		position: relative;
		word-wrap: break-word;
		line-height: 1.4;
	}

	.message-received {
		background: #ffffff;
		box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
	}

	.message-text {
		font-size: 14px;
		color: #303030;
		margin: 0;
		padding: 6px 12px 4px 12px;
	}

	.message-time {
		font-size: 11px;
		text-align: right;
		margin-top: 4px;
		padding: 0 12px 8px 12px;
		line-height: 1;
	}
</style>
