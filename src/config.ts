export interface SMVConfig {
  checkoutUrl: string;
  emailFormEndpoint: string;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  refundUrl: string;
  productPrice: string;
}

declare global {
  interface Window {
    SMV_CONFIG?: Partial<SMVConfig>;
  }
}

export const defaultConfig: SMVConfig = {
  checkoutUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.checkoutUrl || '',
  emailFormEndpoint: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.emailFormEndpoint || '',
  supportEmail: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.supportEmail || '',
  privacyUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.privacyUrl || '',
  termsUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.termsUrl || '',
  refundUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.refundUrl || '',
  productPrice: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.productPrice || '$12.99',
};

export const isSecureUrl = (url?: string): boolean => {
  return typeof url === 'string' && /^https:\/\//i.test(url.trim());
};

export const isValidEmail = (email?: string): boolean => {
  return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email.trim());
};
