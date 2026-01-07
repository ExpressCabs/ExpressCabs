import { useEffect, useState } from "react";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

export function useGoogleMapsReady({ enabled }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });

    return () => { cancelled = true; };
  }, [enabled]);

  return { ready, error };
}
