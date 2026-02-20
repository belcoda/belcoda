export const CREDIT_PURCHASE_AMOUNTS_USD = [50, 200, 1000] as const;

export type CreditPurchaseAmountUsd = (typeof CREDIT_PURCHASE_AMOUNTS_USD)[number];

export const CREDIT_PURCHASE_METADATA_TYPE = 'organization-credit-topup';

export function isCreditPurchaseAmountUsd(amount: number): amount is CreditPurchaseAmountUsd {
	return CREDIT_PURCHASE_AMOUNTS_USD.some((presetAmount) => presetAmount === amount);
}

export function parseCreditPurchaseAmountUsd(rawAmount: string | null | undefined): number | null {
	const parsedAmount = Number.parseInt(rawAmount ?? '', 10);
	if (!Number.isFinite(parsedAmount)) {
		return null;
	}
	if (!isCreditPurchaseAmountUsd(parsedAmount)) {
		return null;
	}
	return parsedAmount;
}
