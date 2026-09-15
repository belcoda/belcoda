import { drizzle } from '$lib/server/db';
import { organization, person, personImport } from '$lib/schema/drizzle';
import pino from '$lib/pino';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { getCsvFromBucket } from '$lib/server/utils/s3';
import { env } from '$env/dynamic/public';
import { parseImportCsv } from '$lib/server/utils/person/import';
import { trackServerAnalyticsEvent } from '$lib/server/analytics';
import { organizationAnalyticsEventNames } from '$lib/utils/organization/analytics';

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
		const importRecord = await drizzle.query.personImport.findFirst({
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

		const [organizationRecord, existingPerson] = await Promise.all([
			drizzle.query.organization.findFirst({
				columns: { settings: true },
				where: eq(organization.id, organizationId)
			}),
			drizzle.query.person.findFirst({
				columns: { id: true },
				where: and(eq(person.organizationId, organizationId), isNull(person.deletedAt))
			})
		]);
		const canCompletePeopleOnboarding =
			organizationRecord?.settings.onboarding !== undefined &&
			organizationRecord.settings.onboarding.people !== 'complete' &&
			!existingPerson;

		await drizzle
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

		const parseResult = await parseImportCsv({
			csvString: csvContent,
			organizationId,
			addedFrom: { type: 'import', importId: personImportId },
			upsert: false
		});

		log.info(
			{
				personImportId,
				totalRows: parseResult.totalRows,
				successCount: parseResult.successCount,
				failedCount: parseResult.failedCount
			},
			'CSV parsing completed'
		);

		let peopleOnboardingCompleted = false;
		if (canCompletePeopleOnboarding && parseResult.successCount > 0) {
			const [completed] = await drizzle
				.update(organization)
				.set({
					settings: sql`
						${organization.settings}
						|| jsonb_build_object(
							'onboarding',
							${organization.settings}->'onboarding' || ${JSON.stringify({ people: 'complete' })}::jsonb
						)
					`,
					updatedAt: new Date()
				})
				.where(
					and(
						eq(organization.id, organizationId),
						sql`${organization.settings}->'onboarding' IS NOT NULL`,
						sql`${organization.settings}->'onboarding'->>'people' IS DISTINCT FROM 'complete'`
					)
				)
				.returning({ id: organization.id });
			peopleOnboardingCompleted = Boolean(completed);
		}

		await drizzle
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

		if (peopleOnboardingCompleted) {
			void trackServerAnalyticsEvent(
				organizationAnalyticsEventNames.onboardingStepCompleted,
				{ step: 'people', method: 'import' },
				'/onboarding'
			);
		}
	} catch (error) {
		log.error({ error, personImportId }, 'Failed to process people import');

		await drizzle
			.update(personImport)
			.set({
				status: 'failed',
				completedAt: new Date()
			})
			.where(eq(personImport.id, personImportId));

		throw error;
	}
}
