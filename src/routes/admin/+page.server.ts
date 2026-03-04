import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq, count, gte, and, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();

	// Fetch all users
	const allUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt
		})
		.from(users)
		.orderBy(users.createdAt);

	// Stats
	const [totalUsersResult] = await db.select({ count: count() }).from(users);
	const [adminCountResult] = await db
		.select({ count: count() })
		.from(users)
		.where(eq(users.role, 'admin'));
	const [activeSessionsResult] = await db.select({ count: count() }).from(sessions);

	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const [newUsersResult] = await db
		.select({ count: count() })
		.from(users)
		.where(gte(users.createdAt, sevenDaysAgo));

	return {
		users: allUsers,
		stats: {
			totalUsers: totalUsersResult?.count ?? 0,
			adminCount: adminCountResult?.count ?? 0,
			activeSessions: activeSessionsResult?.count ?? 0,
			newUsers7d: newUsersResult?.count ?? 0
		},
		currentUserId: session?.user?.id
	};
};

export const actions: Actions = {
	changeRole: async (event) => {
		const session = await event.locals.auth();
		if (!session?.user?.id || session.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}

		const formData = await event.request.formData();
		const userId = formData.get('userId') as string;
		const newRole = formData.get('role') as string;

		if (!userId || !newRole) {
			return fail(400, { error: 'User ID and role are required' });
		}

		if (!['user', 'admin'].includes(newRole)) {
			return fail(400, { error: 'Invalid role' });
		}

		// Prevent changing own role
		if (userId === session.user.id) {
			return fail(400, { error: 'You cannot change your own role' });
		}

		await db
			.update(users)
			.set({ role: newRole, updatedAt: new Date() })
			.where(eq(users.id, userId));

		return { success: true, message: `User role changed to ${newRole}` };
	},

	deleteUser: async (event) => {
		const session = await event.locals.auth();
		if (!session?.user?.id || session.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}

		const formData = await event.request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Prevent self-deletion
		if (userId === session.user.id) {
			return fail(400, { error: 'You cannot delete your own account' });
		}

		await db.delete(users).where(eq(users.id, userId));

		return { success: true, message: 'User deleted successfully' };
	}
};
