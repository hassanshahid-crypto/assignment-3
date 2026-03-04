import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user || !user.password) {
			return fail(401, { error: 'Invalid email or password', email });
		}

		const isValid = await bcrypt.compare(password, user.password);
		if (!isValid) {
			return fail(401, { error: 'Invalid email or password', email });
		}

		// Check email verification
		if (!user.emailVerified) {
			return fail(403, { error: 'Please verify your email before signing in. Check your inbox for the verification link.', email });
		}

		// Create database session
		const sessionToken = crypto.randomUUID();
		const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		await db.insert(sessions).values({
			sessionToken,
			userId: user.id,
			expires
		});

		// Set Auth.js session cookie
		const isSecure = event.url.protocol === 'https:';
		const cookieName = isSecure
			? '__Secure-authjs.session-token'
			: 'authjs.session-token';

		event.cookies.set(cookieName, sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: isSecure,
			expires
		});

		throw redirect(303, '/dashboard');
	}
};
