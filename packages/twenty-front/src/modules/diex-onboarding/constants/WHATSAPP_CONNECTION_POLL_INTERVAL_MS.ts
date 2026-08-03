// The connection route answers slowly while Evolution provisions an instance,
// and the QR it returns expires on its own, so the page re-asks until the scan
// lands instead of leaving a dead image on screen.
export const WHATSAPP_CONNECTION_POLL_INTERVAL_MS = 5_000;
