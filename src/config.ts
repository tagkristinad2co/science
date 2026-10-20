export interface SMVConfig {
  checkoutUrl: string;
  bundleCheckoutUrl: string;
  productPrice: string;
  upgradePrice: string;
  bundlePrice: string;
  emailFormEndpoint: string;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  refundUrl: string;
}

declare global {
  interface Window {
    SMV_CONFIG?: Partial<SMVConfig>;
  }
}

export const defaultConfig: SMVConfig = {
  checkoutUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.checkoutUrl || 'https://buy.stripe.com/9B6dR98Ni05C3rz4l2f7i00',
  bundleCheckoutUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.bundleCheckoutUrl || 'https://buy.stripe.com/8x24gze7CdWs7HPaJqf7i01',
  productPrice: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.productPrice || 'RM39.90',
  upgradePrice: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.upgradePrice || 'RM10',
  bundlePrice: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.bundlePrice || 'RM49.90',
  emailFormEndpoint: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.emailFormEndpoint || '',
  supportEmail: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.supportEmail || '',
  privacyUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.privacyUrl || '',
  termsUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.termsUrl || '',
  refundUrl: (window as unknown as { SMV_CONFIG?: Partial<SMVConfig> }).SMV_CONFIG?.refundUrl || '',
};

export const isSecureUrl = (url?: string): boolean => {
  return typeof url === 'string' && /^https:\/\//i.test(url.trim());
};

export const isValidEmail = (email?: string): boolean => {
  return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email.trim());
};
