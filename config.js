/* INTEGRATION SETTINGS — set real URLs before publishing.
   Checkout example: hosted Payhip / Lemon Squeezy / Stripe Payment Link.
   Email example: your ESP's form POST endpoint, configured for CORS or same-origin.
   Keep API keys and secrets OFF the frontend. */
window.SMV_CONFIG = {
  checkoutUrl: '', // REQUIRED: full HTTPS URL of live $12.99 checkout
  emailFormEndpoint: '', // REQUIRED for lead capture: HTTPS POST endpoint accepting email, source, consent
  supportEmail: '', // REQUIRED before publishing
  privacyUrl: '', // REQUIRED before collecting emails
  termsUrl: '', // REQUIRED before processing orders
  refundUrl: '', // REQUIRED before processing orders
  productPrice: '$12.99'
};
