import { PRICING_CONFIG, PricingTier, FOUNDING_ENDS_AT } from '../shared/pricing';

export type { PricingTier };

export interface Testimonial {
  name: string;
  text: string;
  photo?: string;
}

export interface SMVConfig {
  foundingEndsAt: string;
  founding: PricingTier;
  official: PricingTier;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  refundUrl: string;
  refundSummary: string;
  testimonials: Testimonial[];
}

export const config: SMVConfig = {
  foundingEndsAt: FOUNDING_ENDS_AT,
  founding: PRICING_CONFIG.founding,
  official: PRICING_CONFIG.official,
  supportEmail: "", // Leave empty for owner to fill in
  privacyUrl: "",
  termsUrl: "",
  refundUrl: "",
  refundSummary: "If a file is faulty or won't open, contact us and we'll fix it or refund you.",
  testimonials: [] as Testimonial[],
};

export const isSecureUrl = (url?: string): boolean => {
  return typeof url === 'string' && /^https:\/\//i.test(url.trim());
};

export const isValidEmail = (email?: string): boolean => {
  return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email.trim());
};

export const isValidMalaysianPhone = (phone?: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+?60|0)[1-9][0-9]{7,9}$/.test(cleaned);
};

export const getLaunchEndText = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const utcTime = d.getTime() + d.getTimezoneOffset() * 60000;
    const myTime = new Date(utcTime + 8 * 3600000);
    const dayName = dayNames[myTime.getDay()];
    const dateNum = myTime.getDate();
    const monthName = monthNames[myTime.getMonth()];
    const year = myTime.getFullYear();
    let hours = myTime.getHours();
    const minutes = myTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `Ends ${dayName}, ${dateNum} ${monthName} ${year}, ${hours}:${minutes} ${ampm} MYT`;
  } catch {
    return 'Ends Wed, 28 Oct 2026, 11:59 pm MYT';
  }
};
