/** Organization balance and ledger amounts are stored in USD hundredths of a cent (10,000 per dollar). */
export const USD_HUNDREDTHS_OF_CENTS_PER_DOLLAR = 10_000;

export const BALANCE_TOP_UP_MIN_USD = 5;
export const BALANCE_TOP_UP_MAX_USD = 50_000;

export const BALANCE_TOP_UP_PRESET_AMOUNTS_USD = [50, 200, 1000] as const;

/** Stripe checkout metadata `type` (legacy value retained for in-flight sessions). */
export const BALANCE_TOP_UP_STRIPE_METADATA_TYPE = 'organization-credit-topup';

/** Stripe metadata field for purchased USD amount (legacy key retained for in-flight sessions). */
export const BALANCE_TOP_UP_STRIPE_AMOUNT_METADATA_KEY = 'creditAmount';

export function hundredthsOfCentsToUsd(hundredthsOfCents: number): number {
	return hundredthsOfCents / USD_HUNDREDTHS_OF_CENTS_PER_DOLLAR;
}

export function usdToHundredthsOfCents(usd: number): number {
	return Math.ceil(usd * 100) * 100;
}

export function formatUsdBalanceFromHundredthsOfCents(
	hundredthsOfCents: number,
	locale: string
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'USD'
	}).format(hundredthsOfCentsToUsd(hundredthsOfCents));
}

export function formatUsdAmount(amountUsd: number, locale: string): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(amountUsd);
}

export function isValidBalanceTopUpAmountUsd(amount: number): boolean {
	return (
		Number.isInteger(amount) && amount >= BALANCE_TOP_UP_MIN_USD && amount <= BALANCE_TOP_UP_MAX_USD
	);
}

export function parseBalanceTopUpAmountUsd(rawAmount: string | null | undefined): number | null {
	const parsedAmount = Number.parseInt(rawAmount ?? '', 10);
	if (!Number.isFinite(parsedAmount)) {
		return null;
	}
	if (!isValidBalanceTopUpAmountUsd(parsedAmount)) {
		return null;
	}
	return parsedAmount;
}
