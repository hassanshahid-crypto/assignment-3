import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { chats, chatMessages } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

async function getQueryEmbedding(text: string): Promise<number[]> {
	const url = env.EMBEDDING_API_URL || 'http://localhost:8000';
	try {
		const res = await fetch(`${url}/embed`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text })
		});
		if (!res.ok) return [];
		const data = await res.json();
		return data.embedding;
	} catch {
		return [];
	}
}

async function retrieveContext(query: string): Promise<{ content: string; documentName: string; chunkIndex: number }[]> {
	try {
		const queryEmbedding = await getQueryEmbedding(query);
		if (!queryEmbedding.length) return [];

		const vectorStr = `[${queryEmbedding.join(',')}]`;

		const results = await db.execute(sql`
			SELECT c.content, c.chunk_index, d.name as document_name,
				   e.embedding <=> ${vectorStr}::vector AS distance
			FROM embeddings e
			JOIN chunks c ON e.chunk_id = c.id
			JOIN documents d ON c.document_id = d.id
			ORDER BY e.embedding <=> ${vectorStr}::vector
			LIMIT 5
		`);

		return (results.rows as any[]).map((r) => ({
			content: r.content,
			documentName: r.document_name,
			chunkIndex: r.chunk_index
		}));
	} catch {
		return [];
	}
}

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
		await db.delete(chatMessages).where(eq(chatMessages.chatId, chatId));

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

	// RAG: Get the latest user message for retrieval
	const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
	let systemPrompt = 'You are a helpful AI assistant. Format your responses using Markdown when appropriate. Use code fences with language identifiers for code blocks.';
	let citations: { content: string; documentName: string; chunkIndex: number }[] = [];

	if (lastUserMessage) {
		const userText =
			lastUserMessage.parts
				?.filter((p: any) => p.type === 'text')
				.map((p: any) => p.text ?? '')
				.join('') ||
			(typeof lastUserMessage.content === 'string' ? lastUserMessage.content : '');

		citations = await retrieveContext(userText);

		if (citations.length > 0) {
			const contextBlocks = citations
				.map(
					(c, i) =>
						`[Source ${i + 1}: ${c.documentName} (chunk ${c.chunkIndex + 1})]\n${c.content}`
				)
				.join('\n\n');

			systemPrompt = `You are a helpful AI assistant with access to the user's documents. Use the following retrieved context to answer the user's question. If the context is relevant, cite your sources using [Source N] notation. If the context is not relevant to the question, answer based on your general knowledge and mention that the answer is not from the uploaded documents.

Format your responses using Markdown. Use code fences with language identifiers for code blocks.

--- Retrieved Context ---
${contextBlocks}
--- End Context ---`;
		}
	}

	const result = streamText({
		model: google('gemini-2.5-flash'),
		system: systemPrompt,
		messages: await convertToModelMessages(messages),
		async onFinish({ text }) {
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
