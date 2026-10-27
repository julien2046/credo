// Only these application routes may fall back to the SPA. Missing catalogue pages stay 404.
export const spaPathPattern =
  /^\/(admin|account|cart|checkout|promo)(\/[^.]*)?$/;
