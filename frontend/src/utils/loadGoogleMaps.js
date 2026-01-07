let promise;

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google);

  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-maps="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.dataset.googleMaps = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return promise;
}
