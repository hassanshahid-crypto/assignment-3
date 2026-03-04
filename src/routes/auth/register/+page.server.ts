import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/server/email';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'All fields are required', name, email });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters', name, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', name, email });
		}

		// Check if user already exists
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing) {
			return fail(400, { error: 'An account with this email already exists', name, email });
		}

		// Create user (emailVerified = null means unverified)
		const hashedPassword = await bcrypt.hash(password, 12);
		const [newUser] = await db
			.insert(users)
			.values({
				name,
				email,
				password: hashedPassword,
				role: 'user'
			})
			.returning({ id: users.id });

		// Create verification token (valid for 24 hours)
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

		await db.insert(emailVerificationTokens).values({
			userId: newUser.id,
			token,
			expires
		});

		const verifyUrl = `${url.origin}/auth/verify-email?token=${token}`;

		try {
			const result = await sendVerificationEmail(email, name, verifyUrl);
			if (!result.delivered) {
				return fail(500, { error: 'Account created but we could not send the verification email. Please contact support.', name, email });
			}
		} catch (err) {
			console.error('Failed to send verification email:', err);
			return fail(500, { error: 'Account created but we could not send the verification email. Please contact support.', name, email });
		}

		throw redirect(303, '/auth/login?verify=required');
	}
};
