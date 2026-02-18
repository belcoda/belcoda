import { json } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { stripeClient } from '$lib/server/stripe';
import {
	CREDIT_PURCHASE_METADATA_TYPE,
	isCreditPurchaseAmountUsd
} from '$lib/utils/billing/credit';

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
	if (typeof amount !== 'number' || !isCreditPurchaseAmountUsd(amount) || !organizationId) {
		return json({ error: 'Invalid credit purchase request' }, { status: 400 });
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
		return json({ error: 'Only organization owners can purchase credits' }, { status: 403 });
	}

	const user = session.user as typeof session.user & { stripeCustomerId?: string | null };
	const checkoutSession = await stripeClient.checkout.sessions.create({
		mode: 'payment',
		success_url: `${event.url.origin}/settings/billing/credit?credit_purchase=success`,
		cancel_url: `${event.url.origin}/settings/billing/credit?credit_purchase=cancelled`,
		...(user.stripeCustomerId
			? {
					customer: user.stripeCustomerId
				}
			: {
					customer_email: session.user.email
				}),
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: 'usd',
					unit_amount: amount * 100,
					product_data: {
						name: `Belcoda credit top-up ($${amount})`,
						description: `Organization credit purchase (${organizationId})`
					}
				}
			}
		],
		client_reference_id: organizationId,
		metadata: {
			type: CREDIT_PURCHASE_METADATA_TYPE,
			organizationId,
			creditAmount: String(amount),
			purchasedByUserId: session.user.id
		}
	});

	if (!checkoutSession.url) {
		return json({ error: 'Unable to create Stripe checkout session' }, { status: 500 });
	}

	return json({ url: checkoutSession.url });
}
