import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return { success: false, error: 'No verification token provided.' };
	}

	// Find valid token
	const [verifyToken] = await db
		.select()
		.from(emailVerificationTokens)
		.where(
			and(
				eq(emailVerificationTokens.token, token),
				gt(emailVerificationTokens.expires, new Date())
			)
		)
		.limit(1);

	if (!verifyToken) {
		return { success: false, error: 'This verification link is invalid or has expired.' };
	}

	// Mark email as verified
	await db
		.update(users)
		.set({ emailVerified: new Date(), updatedAt: new Date() })
		.where(eq(users.id, verifyToken.userId));

	// Delete all verification tokens for this user
	await db
		.delete(emailVerificationTokens)
		.where(eq(emailVerificationTokens.userId, verifyToken.userId));

	throw redirect(303, '/auth/login?verified=true');
};
