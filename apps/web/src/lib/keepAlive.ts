import restClient from "./restClient";

/**
 * Render free tier sleeps after 15 minutes of inactivity.
 * This utility pings the health endpoint every 13 minutes to keep the instance warm.
 */
const PING_INTERVAL = 13 * 60 * 1000;

export function startKeepAlive() {
  if (typeof window === 'undefined') return;

  // Initial ping
  restClient.get('/actuator/health').catch(() => {});

  // Scheduled pings
  setInterval(() => {
    restClient.get('/actuator/health').catch(() => {});
  }, PING_INTERVAL);
}
