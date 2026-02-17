import { env } from '$env/dynamic/private';
import Stripe from 'stripe';

if (!env.STRIPE_SECRET_KEY) {
	throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2025-11-17.clover'
});
