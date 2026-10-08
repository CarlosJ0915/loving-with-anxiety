/* ═══════════════════════════════════════════════
   checkout-links — where Buy now sends the customer to pay.

   One Stripe Payment Link per format, copied from the Stripe dashboard.
   Nothing secret belongs in this file: a Payment Link URL is public by
   design, which is exactly why a static site can use one. The card, the
   shipping address for the printed edition and the receipt are all handled
   on Stripe's own page, so no payment detail ever touches this site.

   Blank means "not connected yet" — Buy now then says so plainly instead of
   navigating. Paste the URLs here and it starts working; nothing else needs
   to change.

   For the printed edition, switch on shipping-address collection in the
   Stripe dashboard for that link — it is a setting there, not a parameter here.
   ═══════════════════════════════════════════════ */

export const PAYMENT_LINKS = {
  digital: "",      // https://buy.stripe.com/...
  experience: "",
  printed: "",
};
