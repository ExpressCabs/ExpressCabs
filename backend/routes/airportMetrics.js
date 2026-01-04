const express = require("express");
const router = express.Router();

router.get("/airport-metrics", async (req, res) => {
  try {
    const { suburb, postcode } = req.query;
    if (!suburb || !postcode) {
      return res.status(400).json({ error: "Missing suburb/postcode" });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "GOOGLE_MAPS_API_KEY missing" });
    }

    const originAddress = `${suburb} VIC ${postcode}, Australia`;
    const destinationAddress = "Melbourne Airport (MEL), VIC, Australia";

    const body = {
      origin: { address: originAddress },
      destination: { address: destinationAddress },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      units: "METRIC",
      languageCode: "en-AU",
    };

    const r = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          // Only request fields we need (cheaper + faster)
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await r.json();

    const route = data?.routes?.[0];
    if (!r.ok || !route) {
      return res.status(500).json({ error: "Google response not OK", data });
    }

    const distanceValue = route.distanceMeters ?? 0; // meters
    const durationValue = parseDurationSeconds(route.duration); // seconds

    return res.json({
      // keep same keys your frontend expects
      distanceText: formatDistance(distanceValue),
      durationText: formatDuration(durationValue),
      durationValue,
      distanceValue,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

function parseDurationSeconds(dur) {
  // Routes API returns "1234s"
  if (typeof dur === "string" && dur.endsWith("s")) {
    const n = Number(dur.slice(0, -1));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatDistance(meters) {
  const km = meters / 1000;
  // Match Google's style-ish: "32.5 km" or "950 m"
  if (km >= 1) return `${round1(km)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

module.exports = router;
