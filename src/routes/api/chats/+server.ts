import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chats, chatMessages } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

// List all chats for the current user
export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const userChats = await db
		.select({
			id: chats.id,
			title: chats.title,
			createdAt: chats.createdAt,
			updatedAt: chats.updatedAt
		})
		.from(chats)
		.where(eq(chats.userId, session.user.id))
		.orderBy(desc(chats.updatedAt));

	return json(userChats);
};

// Create a new chat
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const title = body.title || 'New Chat';

	const [chat] = await db
		.insert(chats)
		.values({
			userId: session.user.id,
			title
		})
		.returning();

	return json(chat);
};
