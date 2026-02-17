import { env } from '$env/dynamic/private';
import Stripe from 'stripe';

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2025-11-17.clover'
});
