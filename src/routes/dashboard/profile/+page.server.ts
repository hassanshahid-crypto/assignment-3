import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user?.id) return { user: null };

	const [user] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt
		})
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	return { user: user ?? null };
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const session = await event.locals.auth();
		if (!session?.user?.id) return fail(401, { error: 'Unauthorized' });

		const formData = await event.request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;

		if (!name || !email) {
			return fail(400, { error: 'Name and email are required', success: false });
		}

		// Check if email is taken by another user
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing && existing.id !== session.user.id) {
			return fail(400, { error: 'Email is already taken', success: false });
		}

		await db
			.update(users)
			.set({ name, email, updatedAt: new Date() })
			.where(eq(users.id, session.user.id));

		return { success: true, message: 'Profile updated successfully' };
	},

	changePassword: async (event) => {
		const session = await event.locals.auth();
		if (!session?.user?.id) return fail(401, { error: 'Unauthorized' });

		const formData = await event.request.formData();
		const currentPassword = formData.get('currentPassword') as string;
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'All password fields are required', success: false });
		}

		if (newPassword.length < 6) {
			return fail(400, { error: 'New password must be at least 6 characters', success: false });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match', success: false });
		}

		const [user] = await db
			.select({ password: users.password })
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		if (!user?.password) {
			return fail(400, { error: 'Unable to verify current password', success: false });
		}

		const isValid = await bcrypt.compare(currentPassword, user.password);
		if (!isValid) {
			return fail(400, { error: 'Current password is incorrect', success: false });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 12);
		await db
			.update(users)
			.set({ password: hashedPassword, updatedAt: new Date() })
			.where(eq(users.id, session.user.id));

		return { success: true, message: 'Password changed successfully' };
	}
};
