# Analytics Manual QA Checklist

## Google Paid
- Open the site with `?gclid=test123` appended to the landing URL.
- Confirm the session resolves to `google_paid`.
- Confirm `gclid=test123` is visible in the protected admin analytics debug output.

## Google Organic
- Visit from a Google search result without any paid click identifiers.
- Confirm the session resolves to `google_organic`.
- Confirm the classification reason shows `google_referrer`.

## Direct
- Paste the homepage URL directly into the browser with no referrer.
- Confirm the session resolves to `direct`.
- Confirm the classification reason shows `empty_referrer`.

## Repeat Short-Session Suspicious Pattern
- Trigger 3 or more very short sessions from the same IP on the same landing page without funnel interaction.
- Confirm risk score rises and includes repeated-pattern reasons such as `repeat_short_no_depth_ip` or `repeat_same_landing_quick_exit`.

## Bot-Like User Agent
- If a staging or local environment allows it, replay a request with a bot-like user agent such as `curl/8.0`.
- Confirm risk score increases and the reasons include `suspicious_user_agent`.

## Melbourne Relevance
- Test with a Melbourne-intent landing page or local route selection.
- Confirm `isLikelyMelbourne` is `true`.
- Confirm reason flags reflect the trigger source, such as `melbourneByLandingPage`, `melbourneByTimezone`, or `melbourneByRoute`.
