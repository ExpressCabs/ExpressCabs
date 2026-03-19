DELETE FROM "VisitEvent"
WHERE "sessionId" IN (
  SELECT "id" FROM "VisitSession"
  WHERE "landingPath" LIKE '/admin%'
     OR "landingUrl" LIKE '%/admin%'
);

DELETE FROM "VisitSession"
WHERE "landingPath" LIKE '/admin%'
   OR "landingUrl" LIKE '%/admin%';

-- The current VisitSecuritySnapshot schema has no sessionId relation and is not being written to
-- by the active analytics controller, so there is no targeted admin-session cleanup statement here.
