import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db';
import { users, passwordResetTokens } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return { valid: false, error: 'No reset token provided.' };
	}

	// Check if token exists and is not expired
	const [resetToken] = await db
		.select()
		.from(passwordResetTokens)
		.where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expires, new Date())))
		.limit(1);

	if (!resetToken) {
		return { valid: false, error: 'This reset link is invalid or has expired.' };
	}

	return { valid: true, token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token || !password || !confirmPassword) {
			return fail(400, { error: 'All fields are required' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		// Verify token
		const [resetToken] = await db
			.select()
			.from(passwordResetTokens)
			.where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expires, new Date())))
			.limit(1);

		if (!resetToken) {
			return fail(400, { error: 'This reset link is invalid or has expired.' });
		}

		// Update password
		const hashedPassword = await bcrypt.hash(password, 12);
		await db
			.update(users)
			.set({ password: hashedPassword, updatedAt: new Date() })
			.where(eq(users.id, resetToken.userId));

		// Delete all reset tokens for this user
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));

		throw redirect(303, '/auth/login?reset=success');
	}
};
