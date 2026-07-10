import { drizzle } from '$lib/server/db';
import { user } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';

export async function _getUserByIdUnsafe({ userId }: { userId: string }) {
	return drizzle.query.user.findFirst({
		where: eq(user.id, userId)
	});
}
