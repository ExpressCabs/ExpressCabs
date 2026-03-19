Set the frontend environment variable below for GA4 test-property validation:

`VITE_GA4_MEASUREMENT_ID=G-VM6W7GNZ3F`

Notes:
- This is the GA4 test property only.
- Public routes should emit `page_view`, booking funnel events, `call_click`, and `whatsapp_click`.
- `/admin` routes are excluded in the frontend tracking layer.
- Existing Google Ads conversion tracking remains separate.
- Optional for DebugView-heavy testing: set `VITE_GA4_DEBUG=true` to add `debug_mode` and console logging for GA4 events in the browser.
