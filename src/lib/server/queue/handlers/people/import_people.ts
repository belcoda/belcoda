import { drizzle } from '$lib/server/db';
import { personImport } from '$lib/schema/drizzle';
import pino from '$lib/pino';
import { eq } from 'drizzle-orm';
import { getCsvFromBucket } from '$lib/server/utils/s3';
import { env } from '$env/dynamic/public';
import { parseImportCsv } from '$lib/utils/import';

const log = pino(import.meta.url);
const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = env;

export async function importPeople({
	personImportId,
	organizationId
}: {
	personImportId: string;
	organizationId: string;
}) {
	log.debug({ personImportId, organizationId }, 'Starting people import processing');

	try {
		const importRecord = await db.query.personImport.findFirst({
			where: (item, { eq, and }) =>
				and(eq(item.id, personImportId), eq(item.organizationId, organizationId))
		});

		if (!importRecord) {
			throw new Error(`Person import not found: ${personImportId}`);
		}

		if (importRecord.status !== 'pending') {
			log.info({ personImportId, status: importRecord.status }, 'Import already processed');
			return;
		}

		await db
			.update(personImport)
			.set({
				status: 'processing'
			})
			.where(eq(personImport.id, personImportId));

		const csvUrl = importRecord.csvUrl;
		const urlParts = new URL(csvUrl);
		const fileKey = urlParts.pathname.substring(1);

		log.debug({ fileKey }, 'Downloading CSV file from S3');

		const csvContent = await getCsvFromBucket(PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME, fileKey);

		if (!csvContent) {
			throw new Error(`Failed to download CSV file: ${fileKey}`);
		}

		log.info({ personImportId }, 'Starting CSV parsing and people import');

		const parseResult = await parseImportCsv(csvContent, organizationId, personImportId);

		log.info(
			{
				personImportId,
				totalRows: parseResult.totalRows,
				successCount: parseResult.successCount,
				failedCount: parseResult.failedCount
			},
			'CSV parsing completed'
		);

		await db
			.update(personImport)
			.set({
				status: 'completed',
				completedAt: new Date(),
				totalRows: parseResult.totalRows,
				processedRows: parseResult.successCount,
				failedRows: parseResult.failedCount,
				failedEntries: parseResult.failedRows
			})
			.where(eq(personImport.id, personImportId));
	} catch (error) {
		log.error({ error, personImportId }, 'Failed to process people import');

		await db
			.update(personImport)
			.set({
				status: 'failed',
				completedAt: new Date()
			})
			.where(eq(personImport.id, personImportId));

		throw error;
	}
}
