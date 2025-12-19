/**
 * Server configuration constants
 * These values control server timeout behavior to prevent hanging requests
 */

/**
 * Server timeout in milliseconds
 * Requests are closed after this period of inactivity
 */
export const SERVER_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Keep-alive timeout in milliseconds
 * Must be greater than SERVER_TIMEOUT_MS
 * Controls how long the server waits for additional requests on the same connection
 */
export const SERVER_KEEP_ALIVE_TIMEOUT_MS = 65000; // 65 seconds

/**
 * Headers timeout in milliseconds
 * Must be greater than SERVER_KEEP_ALIVE_TIMEOUT_MS
 * Controls how long the server waits for HTTP headers to be received
 */
export const SERVER_HEADERS_TIMEOUT_MS = 66000; // 66 seconds

/**
 * Default HTTP status code for successful OPTIONS requests (CORS preflight)
 */
export const CORS_PREFLIGHT_SUCCESS_STATUS = 204;

