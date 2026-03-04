import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, passwordResetTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '$lib/server/email';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		// Always return success message to prevent email enumeration
		const successMessage = 'If an account with that email exists, we sent a password reset link.';

		const [user] = await db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user) {
			return { success: true, message: successMessage };
		}

		// Delete any existing reset tokens for this user
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

		// Create new token (valid for 1 hour)
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 60 * 60 * 1000);

		await db.insert(passwordResetTokens).values({
			userId: user.id,
			token,
			expires
		});

		const resetUrl = `${url.origin}/auth/reset-password?token=${token}`;

		try {
			const result = await sendPasswordResetEmail(user.email, user.name ?? '', resetUrl);
			if (!result.delivered) {
				return fail(500, { error: 'Could not send the reset email. Please try again later.' });
			}
		} catch (err) {
			console.error('Failed to send password reset email:', err);
			return fail(500, { error: 'Could not send the reset email. Please try again later.' });
		}

		return { success: true, message: 'Password reset link sent! Check your email inbox.' };
	}
};
