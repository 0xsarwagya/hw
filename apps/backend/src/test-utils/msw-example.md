# MSW Usage Example

MSW (Mock Service Worker) is available for mocking HTTP requests in backend tests.

## Basic Usage

```typescript
import { server } from "../test-utils/msw-setup";
import { http, HttpResponse } from "msw";

describe("MyService", () => {
  beforeEach(() => {
    // Setup MSW handlers for this test suite
    server.use(
      http.get("https://api.example.com/users", () => {
        return HttpResponse.json([{ id: 1, name: "John" }]);
      })
    );
  });

  it("should fetch users from external API", async () => {
    // Your test code here
    // MSW will intercept HTTP requests to https://api.example.com/users
  });
});
```

## Note

For database operations in unit tests, Jest mocks (as currently used) are the recommended approach.
MSW is useful for:
- Mocking external HTTP API calls
- Integration tests that make HTTP requests
- Testing error scenarios from external services

