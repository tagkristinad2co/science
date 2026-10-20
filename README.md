# Science Made Visual — Website Package

## Included
- `index.html`: mobile-first direct-response sales page with genuine watermarked PDF previews, gallery lightbox, FAQ, and checkout buttons.
- `free-sample.html`: free 5-sheet sample opt-in with explicit optional marketing consent.
- `styles.css` and `site.js`: responsive styles and functional client-side interactions.
- `assets/page-*.webp`: compressed WATERMARKED previews rendered from the real uploaded science PDFs.
- `downloads/science-made-visual-free-5-sheet-sample.pdf`: actual sample PDF containing original pages 3, 8, 22, 35 and 42 plus a cover and final offer page.
- `config.js`: integration points for checkout, email endpoint, legal pages, and support.

## Mandatory launch configuration
1. **Commercial rights and fact-check:** confirm the underlying PDFs are legally yours to sell and check all scientific content.
2. In `config.js`, set `checkoutUrl` to your LIVE USD $12.99 hosted checkout link. Turn on the checkout provider's **secured digital-file fulfillment**. **Do not upload all 50 paid originals into the public web directory**.
3. In `config.js`, set `emailFormEndpoint` to a securely configured endpoint accepting JSON POST `{email, source, marketing_consent}` and returning a 2xx success response. It MUST support CORS if hosted elsewhere. Use an ESP integration service or your own backend to validate, rate-limit, record consent, and deliver the free sample email. DO NOT insert email provider API keys or credentials in frontend code.
4. Add support email, privacy policy, terms and refund URLs in `config.js`. This package intentionally does not fabricate company identity, legal policies, testimonials, or checkout connections.
5. Set up **5-part nurture sequence** in your ESP for subscribers with explicit marketing consent. Transactional delivery of the free PDF is distinct from marketing opt-in.
6. Connect Meta Pixel/Conversions API and web analytics only after configuring privacy/consent handling. Do not put secrets into the source code. Confirm a real purchase before firing `Purchase` events.
7. If using Payhip or other hosted digital checkout, keep the original 50 PDF pages in a private seller dashboard, not this static website package.
8. Verify taxes, currency settlement, customer support, and consumer digital refund requirements before taking global payments.

## Hosting
Upload folder contents to Netlify, Cloudflare Pages, Vercel static hosting or a standard HTTPS web server. Both pages use relative links so they also open locally, although some browsers restrict local file behavior. For local testing run `python -m http.server 8000` from this folder and open `http://localhost:8000`.

## Behavior without integrations
- Checkout buttons alert that checkout is not connected (they do not invent transactions).
- Lead form explicitly remains in demo mode and **does not claim to save subscriber emails**. The actual free PDF is still available from the direct download link. Once endpoint is configured, successful submission produces a working download link.

## Sample
Includes five real sheets: Carbon Cycle, Acids/Bases/pH, Human Heart, Electric Current/Resistance, Periodic Table. Original paid sheets are not published in the public site.
