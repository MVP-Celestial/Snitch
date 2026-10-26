# Frontend UI review — 27 October 2026

Project: Snitch/Frontend. Scope: source review of all registered routes and supporting APIs, plus browser verification of the new cart UI. This review does not certify live backend flows.

## Implemented in this update

- Cart styling uses Tailwind utilities directly in Cart.jsx; Cart.css and the Home.css import were removed. The design and existing cart behaviour were retained.
- Cart at /cart: product images and fallback, variant attributes, quantity and per-item amounts, subtotals separated by currency, stock-aware increment button, responsive summary, light/dark themes, and loading/empty/error/retry/update feedback.
- Cart links from the buyer homepage and product page.
- Fixed the cart hook's undefined setCart dispatch; it now uses setItems and returns server cart contents.
- Quantity increments call the existing endpoint, then reload the authoritative cart instead of guessing local state.
- Fixed ProductDetail's add-to-cart call to pass productId and variantId as separate arguments.
- Fixed protected-route rendering: declarative redirects, no null-user crash, and role guard.
- Checkout remains explicitly unavailable. No local-only remove/decrease actions pretend to persist.

## Remaining work, in suggested order

| Priority | Screen / flow | Current gap | Evidence / next step |
|---|---|---|---|
| 1 | Cart integration | Real requests are blocked by backend defects. | Backend/src/controllers/cart.controller.js uses undefined quantity, variant._id instead of variants._id, varient instead of the model's variants field, and reassigns a const cart. Backend/src/validator/cart.validator.js calls validateResult instead of imported validationResult. Fix the server contract before live end-to-end testing. Backend files were not changed. |
| 1 | Cart editing | No decrease or remove actions. | Backend/src/routes/cart.routes.js only exposes add/get/increment. Add persistent decrease/remove endpoints, then connect corresponding controls. |
| 1 | Checkout | No delivery address, shipping choice, payment or order review screen. | No checkout route or service exists. Shipping/taxes are not invented in the cart; checkout is disabled. Build alongside order/payment APIs. |
| 1 | Product detail | No buyer size/color selector. | ProductDetail.jsx always selects product.variants[0]._id. Add a variant selector, variant-specific images/price/stock, and unavailable states. |
| 2 | Seller product management | Variant creation and stock editing are preview-only. | SellerProductDetail.jsx generates local-* variants and updates React state. Its preview warning is accurate. Wire creation to the existing add-variant API; stock updates need a persistent endpoint. |
| 2 | Password recovery | Login links to an unimplemented page. | /forgot-password is linked in Login.jsx but has no registered route or recovery service. Add request/reset screens and server flow. |
| 2 | Orders | No order confirmation, buyer order history/details/tracking, or seller order management. | No order routes/services exist. Add after checkout/order APIs. |
| 2 | Account | No profile, saved addresses or sign-out UI. | No account routes or logout service are present. Account navigation and session ending need implementation. |
| 3 | Legal pages | Registration links lead to missing pages. | /terms and /privacy are linked in Register.jsx but not registered. Supply actual policy text and pages. |
| 3 | Branding / consistency | Login and registration still show stitch branding; seller/auth screens use a different visual system. | Login.jsx and Register.jsx still render stitch. Apply Celestial Drips branding and shared theme/navigation styles. |
| 3 | Route fallbacks | No custom not-found screen. | app.routes.jsx has no wildcard route or branded error boundary. Add a helpful 404/error page with navigation back to the collection. |

## Already present

- Homepage / collection: hero, search, currency filter, product cards, loading/error/empty states.
- Login and registration layouts and API calls; Google sign-in has an actual backend route (not classified as a missing UI).
- Product detail/gallery and add-to-cart button, with limitations listed above.
- Seller product list/dashboard, create-product form and seller product/variant screen.

## Verification

- npm run build: passed (existing large Three.js chunk advisory remains).
- ESLint: passed for Cart.jsx, cart utilities, useCart.js and Protected.jsx.
- Browser at 1440px desktop and 390px mobile: inspected screenshots in both themes; no horizontal mobile overflow.
- Controlled API responses: verified quantity increment endpoint parameters, server reload and subtotal changes, stock-error feedback, empty/loading/error/retry states, multiple currencies, disabled checkout and unauthenticated redirect. No uncaught page errors.
- Test fixtures exist only in ui-backups/20261027-cart/verification/cart-check.cjs; production pages do not contain sample products.
- Live checkout/payment/cart backend behaviour was not tested or claimed working.

Backups of modified existing files: ui-backups/20261027-cart/src/.

