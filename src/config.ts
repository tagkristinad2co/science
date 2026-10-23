import { PRICING_CONFIG, PricingTier, FOUNDING_ENDS_AT } from '../shared/pricing';

export type { PricingTier };

export interface Testimonial {
  name: string;
  text: string;
  photo?: string;
}

export interface BusinessConfig {
  name: string;
  registrationNo: string;
  address: string;
  email: string;
  phone: string;
  responseTime: string;
}

export interface ManualPaymentConfig {
  enabled: boolean;
  accountName: string;
  reviewTime: string;
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
  business: BusinessConfig;
  policiesLastUpdated: string;
  manualPayment: ManualPaymentConfig;
  onlinePaymentLabel: string;
}

export const config: SMVConfig = {
  foundingEndsAt: FOUNDING_ENDS_AT,
  founding: PRICING_CONFIG.founding,
  official: PRICING_CONFIG.official,
  onlinePaymentLabel: "Card & FPX online banking",
  supportEmail: "support.mathceria@gmail.com",
  privacyUrl: "",
  termsUrl: "/terms",
  refundUrl: "",
  refundSummary: "If a file is faulty or won't open, contact us and we'll fix it or refund you.",
  testimonials: [] as Testimonial[],
  business: {
    name: "TRE Marketing Enterprise",
    registrationNo: "201603074497",
    address: "NO. 63-2, JALAN EQUINE 10F, TAMAN EQUINE , 43300 SERI KEMBANGAN, SELANGOR.",
    email: "support.mathceria@gmail.com",
    phone: "60122798277",
    responseTime: "2 working days",
  },
  policiesLastUpdated: "22 October 2026",
  manualPayment: {
    enabled: true,
    accountName: "[NAME SHOWN ON QR]",
    reviewTime: "within 24 hours (usually much faster, 9am–10pm daily)",
  },
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
