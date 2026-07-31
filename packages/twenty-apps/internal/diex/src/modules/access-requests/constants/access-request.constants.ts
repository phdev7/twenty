export const SUBMIT_ACCESS_REQUEST_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000002';
export const ACCESS_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000003';
export const ACCESS_REQUESTS_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000004';
export const ACCESS_REQUESTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000005';
export const ACCESS_REQUESTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000006';
export const ACCESS_REQUESTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000007';
export const ACCESS_REQUESTS_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000008';

export const SUBMIT_ACCESS_REQUEST_ROUTE = '/diex/access-requests';

// This route accepts input from anyone on the internet, so every string is
// capped before it reaches the database. The caps are generous for a human and
// hostile to a script pasting a payload.
export const ACCESS_REQUEST_FIELD_MAX_LENGTH = 200;
export const ACCESS_REQUEST_GOAL_MAX_LENGTH = 1_000;

// A single email can only ever hold one row: repeat submissions bump a counter
// instead of inserting. Record growth is therefore bounded by distinct emails,
// not by request volume.
export const ACCESS_REQUEST_MAX_SUBMISSIONS_PER_EMAIL = 25;
