# Science Made Visual (React + TypeScript + Vite)

A modern, responsive React application showcasing the **Science Made Visual** 100-sheet illustrated study collection covering Biology, Chemistry, Physics, and Earth Science (with optional +RM10 upgrade to 200 sheets).

## Features Ported
- **Direct-Response Sales Experience**: Mobile-first single-column direct-response layout with hero 3D mockup stack, pain points, topic overviews, Founder's Edition pricing card with upgrade upsell, and collapsible FAQ.
- **Interactive Lightbox Modal**: High-resolution watermarked previews of 10 genuine study sheets with keyboard (ESC) and backdrop dismiss.
- **Responsive Navigation & Mobile Sticky Bar**: Sticky header navigation, smooth section scrolling, and mobile sticky checkout bar.
- **Policy & Contact Modals**: Integrated accessible modals for Terms of Service, Privacy Policy, Refund Policy, and Support.
- **Configurable Integrations**: Easy runtime configuration (`public/config.js` and `src/config.ts`) for checkout links, policies, and pricing.

## Getting Started

### Development
```bash
npm install
npm run dev
```
The dev server runs on `http://0.0.0.0:3000`.

### Building
```bash
npm run build
```

### Configuration
Update `public/config.js` or `src/config.ts` to configure your live checkout URL (Payhip, Lemon Squeezy, Stripe), email capture endpoint, or custom policy links.
