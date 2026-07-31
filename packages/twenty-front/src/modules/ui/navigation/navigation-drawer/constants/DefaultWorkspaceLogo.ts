// Upstream pointed this at twentyhq.github.io, so every workspace without its
// own logo loaded the vendor's logotype from the vendor's servers, in the
// customer's browser. Empty makes Avatar fall back to the workspace's own
// initial, which is also the right answer for a white-label product: a
// customer's workspace should look like the customer, not like the platform.
export const DEFAULT_WORKSPACE_LOGO = '';
