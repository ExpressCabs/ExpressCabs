import { useEffect } from "react";

// const ADS_ID = "AW-17249057389";
const DELAY_MS = 4000;

export default function DelayedGtag() {
  useEffect(() => {
    // prevent double-loading
    if (window.__gtag_delayed_loaded__) return;

    const t = setTimeout(() => {
      if (window.__gtag_delayed_loaded__) return;
      window.__gtag_delayed_loaded__ = true;

      // 1) load gtag library
      const s = document.createElement("script");
      s.async = true;
      //s.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`;
      document.head.appendChild(s);

      // 2) init config
      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      window.gtag = window.gtag || gtag;

      window.gtag("js", new Date());
      //window.gtag("config", ADS_ID);
    }, DELAY_MS);

    return () => clearTimeout(t);
  }, []);

  return null;
}
