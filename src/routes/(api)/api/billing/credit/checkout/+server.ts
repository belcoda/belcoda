import { json } from '@sveltejs/kit';
import { db, drizzle } from '$lib/server/db';
import { stripeClient } from '$lib/server/stripe';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import {
	BALANCE_TOP_UP_STRIPE_AMOUNT_METADATA_KEY,
	BALANCE_TOP_UP_STRIPE_METADATA_TYPE,
	isValidBalanceTopUpAmountUsd
} from '$lib/utils/billing/balance';
import { organization as organizationTable } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';

type CheckoutRequestBody = {
	amount?: number;
	organizationId?: string;
};

export async function POST(event) {
	const session = event.locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: CheckoutRequestBody | null = null;
	try {
		body = (await event.request.json()) as CheckoutRequestBody;
	} catch {
		return json({ error: 'Invalid request payload' }, { status: 400 });
	}

	const amount = body?.amount;
	const organizationId = body?.organizationId;
	if (typeof amount !== 'number' || !isValidBalanceTopUpAmountUsd(amount) || !organizationId) {
		return json({ error: 'Invalid balance top-up request' }, { status: 400 });
	}

	let customerId: string | null = null;

	const organization = await db.transaction(async (tx) => {
		const organization = await getOrganizationByIdUnsafe({
			organizationId,
			tx
		});
		return organization;
	});
	if (!organization) {
		return json({ error: 'Organization not found' }, { status: 404 });
	}

	const membership = await drizzle.query.member.findFirst({
		where: (row, { and, eq }) =>
			and(
				eq(row.userId, session.user.id),
				eq(row.organizationId, organizationId),
				eq(row.role, 'owner')
			)
	});
	if (!membership) {
		return json({ error: 'Only organization owners can add funds' }, { status: 403 });
	}

	if (!organization.stripeCustomerId) {
		//create a stripe customer ID desho?
		const stripeCustomer = await stripeClient.customers.create({
			email: organization.billingEmail ?? session.user.email,
			name: organization.name,
			metadata: {
				organizationId
			}
		});
		await drizzle
			.update(organizationTable)
			.set({
				stripeCustomerId: stripeCustomer.id
			})
			.where(eq(organizationTable.id, organizationId));
		customerId = stripeCustomer.id;
	} else {
		customerId = organization.stripeCustomerId;
	}

	if (!customerId) {
		return json({ error: 'Unable to create or find a Stripe customer ID' }, { status: 500 });
	}

	const checkoutSession = await stripeClient.checkout.sessions.create({
		mode: 'payment',
		success_url: `${event.url.origin}/settings/billing/credit?balance_purchase=success`,
		cancel_url: `${event.url.origin}/settings/billing/credit?balance_purchase=cancelled`,
		customer: customerId,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: 'usd',
					unit_amount: amount * 100,
					product_data: {
						name: `Belcoda balance top-up ($${amount})`,
						description: `Organization balance top-up (${organization.name})`
					}
				}
			}
		],
		client_reference_id: organizationId,
		metadata: {
			type: BALANCE_TOP_UP_STRIPE_METADATA_TYPE,
			organizationId,
			[BALANCE_TOP_UP_STRIPE_AMOUNT_METADATA_KEY]: String(amount),
			purchasedByUserId: session.user.id
		}
	});

	if (!checkoutSession.url) {
		return json({ error: 'Unable to create Stripe checkout session' }, { status: 500 });
	}

	return json({ url: checkoutSession.url });
}
