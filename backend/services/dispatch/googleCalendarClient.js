const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3';

let cachedToken = null;

const isCalendarEnabled = () => String(process.env.GOOGLE_CALENDAR_ENABLED || 'false').toLowerCase() === 'true';

const getCalendarConfig = () => ({
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  timezone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'Australia/Melbourne',
  lookaheadHours: Number(process.env.DISPATCH_LOOKAHEAD_HOURS || 168),
});

const refreshAccessToken = async ({ fetchImpl = global.fetch } = {}) => {
  const { clientId, clientSecret, refreshToken } = getCalendarConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Calendar OAuth is not configured');
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.accessToken;

  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error('Failed to refresh Google Calendar access token');
  }

  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000,
  };
  return cachedToken.accessToken;
};

const listUpcomingEvents = async ({ now = new Date(), fetchImpl = global.fetch } = {}) => {
  if (!isCalendarEnabled()) return { enabled: false, events: [] };

  const { calendarId, timezone, lookaheadHours } = getCalendarConfig();
  const accessToken = await refreshAccessToken({ fetchImpl });
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000).toISOString();
  const encodedCalendarId = encodeURIComponent(calendarId);
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeZone: timezone,
    maxResults: '250',
  });

  const response = await fetchImpl(`${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodedCalendarId}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error('Failed to read Google Calendar events');
  }

  return { enabled: true, events: body.items || [], timeMin, timeMax };
};

const createCalendarEvent = async ({ title, description, startTime, endTime }, { fetchImpl = global.fetch } = {}) => {
  const { calendarId, timezone } = getCalendarConfig();
  const accessToken = await refreshAccessToken({ fetchImpl });
  const response = await fetchImpl(`${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: title,
      description,
      start: { dateTime: new Date(startTime).toISOString(), timeZone: timezone },
      end: { dateTime: new Date(endTime || new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(), timeZone: timezone },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Failed to create Google Calendar event');
  return body;
};

const updateCalendarEvent = async (eventId, patch, { fetchImpl = global.fetch } = {}) => {
  const { calendarId, timezone } = getCalendarConfig();
  const accessToken = await refreshAccessToken({ fetchImpl });
  const data = {};
  if (patch.title !== undefined) data.summary = patch.title;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.startTime !== undefined) {
    data.start = { dateTime: new Date(patch.startTime).toISOString(), timeZone: timezone };
  }
  if (patch.endTime !== undefined) {
    data.end = { dateTime: new Date(patch.endTime).toISOString(), timeZone: timezone };
  }

  const response = await fetchImpl(`${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Failed to update Google Calendar event');
  return body;
};

module.exports = {
  GOOGLE_CALENDAR_BASE_URL,
  GOOGLE_TOKEN_URL,
  createCalendarEvent,
  getCalendarConfig,
  isCalendarEnabled,
  listUpcomingEvents,
  refreshAccessToken,
  updateCalendarEvent,
};
