import { json } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { stripeClient } from '$lib/server/stripe';
import {
	BALANCE_TOP_UP_STRIPE_AMOUNT_METADATA_KEY,
	BALANCE_TOP_UP_STRIPE_METADATA_TYPE,
	isValidBalanceTopUpAmountUsd
} from '$lib/utils/billing/balance';

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

	const user = session.user as typeof session.user & { stripeCustomerId?: string | null };
	const checkoutSession = await stripeClient.checkout.sessions.create({
		mode: 'payment',
		success_url: `${event.url.origin}/settings/billing/credit?balance_purchase=success`,
		cancel_url: `${event.url.origin}/settings/billing/credit?balance_purchase=cancelled`,
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
						name: `Belcoda balance top-up ($${amount})`,
						description: `Organization balance top-up (${organizationId})`
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
