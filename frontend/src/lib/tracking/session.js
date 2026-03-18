import { parseLandingAttribution } from './attribution';

const VISITOR_TOKEN_KEY = 'express_cabs_visitor_token';
const SESSION_TOKEN_KEY = 'express_cabs_session_token';
const LANDING_ATTRIBUTION_KEY = 'express_cabs_landing_attribution';

const safeLocalStorage = () => {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const safeSessionStorage = () => {
  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
};

const createToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `ec-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

const readJson = (storage, key) => {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const writeJson = (storage, key, value) => {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage failures.
  }
};

export function getOrCreateVisitorToken() {
  if (typeof window === 'undefined') return '';
  const storage = safeLocalStorage();
  const existing = storage?.getItem(VISITOR_TOKEN_KEY);
  if (existing) return existing;

  const nextToken = createToken();
  storage?.setItem(VISITOR_TOKEN_KEY, nextToken);
  return nextToken;
}

export function getOrCreateSessionToken() {
  if (typeof window === 'undefined') return '';
  const storage = safeSessionStorage();
  const existing = storage?.getItem(SESSION_TOKEN_KEY);
  if (existing) return existing;

  const nextToken = createToken();
  storage?.setItem(SESSION_TOKEN_KEY, nextToken);
  return nextToken;
}

export function getOrCreateLandingAttribution() {
  if (typeof window === 'undefined') {
    return parseLandingAttribution();
  }

  const storage = safeSessionStorage();
  const existing = readJson(storage, LANDING_ATTRIBUTION_KEY);
  if (existing?.landingPath) {
    return existing;
  }

  const attribution = parseLandingAttribution();
  writeJson(storage, LANDING_ATTRIBUTION_KEY, attribution);
  return attribution;
}

export function getTrackingContext() {
  const visitorToken = getOrCreateVisitorToken();
  const sessionToken = getOrCreateSessionToken();
  const attribution = getOrCreateLandingAttribution();

  return {
    visitorToken,
    sessionToken,
    attribution,
  };
}

export function getTrackingPageContext() {
  if (typeof window === 'undefined') {
    return {
      path: '',
      pageTitle: '',
      pageLocation: '',
    };
  }

  return {
    path: `${window.location.pathname}${window.location.search}`,
    pageTitle: typeof document !== 'undefined' ? document.title : '',
    pageLocation: window.location.href,
  };
}
