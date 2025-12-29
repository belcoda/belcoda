import { db } from '$lib/server/db';
export async function checkEventSlug({
	slug,
	organizationId
}: {
	slug: string;
	organizationId: string;
}) {
	const result = await db.query.event.findFirst({
		where: (row, { eq, and, isNull }) =>
			and(eq(row.slug, slug), eq(row.organizationId, organizationId), isNull(row.deletedAt))
	});
	return result ? true : false;
}
export async function checkEventTitle({
	title,
	organizationId
}: {
	title: string;
	organizationId: string;
}) {
	const result = await db.query.event.findFirst({
		where: (row, { eq, and, isNull }) =>
			and(eq(row.title, title), eq(row.organizationId, organizationId), isNull(row.deletedAt))
	});
	return result ? true : false;
}
