import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { chats, chatMessages } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { messages, chatId } = await request.json();

	// If chatId provided, verify ownership
	if (chatId) {
		const [chat] = await db
			.select()
			.from(chats)
			.where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)))
			.limit(1);

		if (!chat) {
			return new Response('Chat not found', { status: 404 });
		}

		// Sync DB with SDK state: clear old messages and re-save the full conversation.
		// This handles edits (which truncate) cleanly — no stale messages left behind.
		await db.delete(chatMessages).where(eq(chatMessages.chatId, chatId));

		// Re-insert all messages from the SDK's current state
		const messagesToSave = messages
			.map((m: { role: string; parts?: { type: string; text?: string }[] }) => {
				const content =
					m.parts
						?.filter((p) => p.type === 'text')
						.map((p) => p.text ?? '')
						.join('') || '';
				if (!content) return null;
				return { chatId, role: m.role, content };
			})
			.filter(Boolean);

		if (messagesToSave.length > 0) {
			await db.insert(chatMessages).values(messagesToSave);
		}

		// Update chat title from first user message if still default
		const firstUserMsg = messages.find((m: { role: string }) => m.role === 'user');
		if (firstUserMsg) {
			const [chatRecord] = await db
				.select({ title: chats.title })
				.from(chats)
				.where(eq(chats.id, chatId))
				.limit(1);

			if (chatRecord?.title === 'New Chat') {
				const content =
					firstUserMsg.parts
						?.filter((p: { type: string }) => p.type === 'text')
						.map((p: { text?: string }) => p.text ?? '')
						.join('') || '';
				if (content) {
					const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
					await db.update(chats).set({ title }).where(eq(chats.id, chatId));
				}
			}
		}

		await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
	}

	const google = createGoogleGenerativeAI({
		apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY
	});

	const result = streamText({
		model: google('gemini-2.5-flash'),
		messages: await convertToModelMessages(messages),
		async onFinish({ text }) {
			// Save assistant response to DB
			if (chatId && text) {
				await db.insert(chatMessages).values({
					chatId,
					role: 'assistant',
					content: text
				});
			}
		}
	});

	return result.toUIMessageStreamResponse();
};
