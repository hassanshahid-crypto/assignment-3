import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chats, chatMessages } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// Get messages for a specific chat
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	// Verify chat belongs to user
	const [chat] = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, params.id), eq(chats.userId, session.user.id)))
		.limit(1);

	if (!chat) {
		return new Response('Not found', { status: 404 });
	}

	const messages = await db
		.select({
			id: chatMessages.id,
			role: chatMessages.role,
			content: chatMessages.content,
			createdAt: chatMessages.createdAt
		})
		.from(chatMessages)
		.where(eq(chatMessages.chatId, params.id))
		.orderBy(asc(chatMessages.createdAt));

	return json({ chat, messages });
};

// Update chat edit versions
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const [chat] = await db
		.select({ id: chats.id })
		.from(chats)
		.where(and(eq(chats.id, params.id), eq(chats.userId, session.user.id)))
		.limit(1);

	if (!chat) {
		return new Response('Not found', { status: 404 });
	}

	const { editVersions } = await request.json();

	await db
		.update(chats)
		.set({ editVersions: editVersions ? JSON.stringify(editVersions) : null })
		.where(eq(chats.id, params.id));

	return json({ success: true });
};

// Delete a chat
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	await db
		.delete(chats)
		.where(and(eq(chats.id, params.id), eq(chats.userId, session.user.id)));

	return json({ success: true });
};
