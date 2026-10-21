// Single source of truth for pricing & founding launch dates

export const FOUNDING_ENDS_AT = '2026-10-28T23:59:00+08:00';

export interface PricingTier {
  price100: string;
  price200: string;
  upgrade: string;
}

export const PRICING_CONFIG = {
  foundingEndsAt: FOUNDING_ENDS_AT,
  founding: {
    price100: 'RM39.90',
    price200: 'RM49.90',
    upgrade: 'RM10',
  } as PricingTier,
  official: {
    price100: 'RM59.90',
    price200: 'RM79.90',
    upgrade: 'RM20',
  } as PricingTier,
};

export interface ServerPricingCalculation {
  amountCents: number;
  formatted: string;
  isFounding: boolean;
  packDescription: string;
}

export function calculatePrice(pack: '100' | '200', nowMs: number = Date.now()): ServerPricingCalculation {
  const targetTime = new Date(FOUNDING_ENDS_AT).getTime();
  const isFounding = nowMs < targetTime;

  if (isFounding) {
    if (pack === '200') {
      return {
        amountCents: 4990,
        formatted: 'RM49.90',
        isFounding: true,
        packDescription: '200 illustrated science sheets (PDF)',
      };
    }
    return {
      amountCents: 3990,
      formatted: 'RM39.90',
      isFounding: true,
      packDescription: '100 illustrated science sheets (PDF)',
    };
  } else {
    if (pack === '200') {
      return {
        amountCents: 7990,
        formatted: 'RM79.90',
        isFounding: false,
        packDescription: '200 illustrated science sheets (PDF)',
      };
    }
    return {
      amountCents: 5990,
      formatted: 'RM59.90',
      isFounding: false,
      packDescription: '100 illustrated science sheets (PDF)',
    };
  }
}
