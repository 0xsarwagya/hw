import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Create a server instance for Node.js environment
export const server = setupServer();

// Default handlers - can be overridden in tests
export const defaultHandlers = [
  // Add default handlers here if needed
  // Example: http.get('https://api.example.com/*', () => HttpResponse.json({}))
];

export { http, HttpResponse };

